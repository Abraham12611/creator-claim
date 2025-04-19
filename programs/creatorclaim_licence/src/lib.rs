use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::token_2022::{self, Mint as Token2022Mint, Token as Token2022Token, TokenAccount as Token2022TokenAccount, Transfer as Token2022Transfer};
use spl_token_2022::ID as TOKEN_2022_PROGRAM_ID;

// Make state and errors available
mod state;
use state::*;

// Import the certificate program crate and its state
// Requires adding `creatorclaim_certificate = { path = "../creatorclaim_certificate", features = ["cpi"] }` to Cargo.toml
// and adding the program declaration to Anchor.toml
use creatorclaim_certificate::state::CertificateDetails;

// Placeholder for actual Certificate Program ID
const CERTIFICATE_PROGRAM_ID: &str = "CERTxxxxxxxxxxxxxxxxxx";

declare_id!("LICxxxxxxxxxxxxxxxxxx"); // Replace with actual Program ID after deploy

#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "CreatorClaim Licence Program",
    project_url: "http://example.com", // TODO: Replace with actual URL
    contacts: "email:security@example.com", // TODO: Replace with actual contact
    policy: "https://example.com/security-policy", // TODO: Replace with actual URL
    preferred_languages: "en"
}

#[program]
pub mod creatorclaim_licence {
    use super::*;

    /// Instruction to purchase a licence for a creative work using Token-2022.
    /// This creates the Licence PDA, transfers payment (USDC via Token-242),
    /// and relies on the Token-2022 Transfer Fee extension (transfer hook)
    /// to automatically distribute royalties based on the mint's configuration.
    ///
    /// Args:
    ///     ctx: Context containing accounts needed.
    ///     purchase_price: The total price including royalties and platform fee.
    ///     expiry_timestamp: Optional expiry for time-limited licences.
    ///
    /// Accounts:
    ///     buyer: The signer purchasing the licence.
    ///     buyer_token_account: The buyer's Token-2022 account to pay from.
    ///     licence: The Licence PDA to be initialized.
    ///     certificate_details: The CertificateDetails account for the work being licensed.
    ///     payment_mint: The Token-2022 mint address configured with the Transfer Fee extension.
    ///     token_program: The Token-2022 Program.
    ///     system_program: System program.
    ///     remaining_accounts: Must include all token accounts that will receive fees
    ///                         (royalty recipients, platform treasury) as specified in the
    ///                         Transfer Fee extension config on the `payment_mint`.
    ///                         These are required by the transfer hook.
    pub fn purchase_licence(
        ctx: Context<PurchaseLicence>,
        purchase_price: u64,
        expiry_timestamp: Option<i64>,
    ) -> Result<()> {
        msg!("Purchasing licence for certificate: {}", ctx.accounts.certificate_details.key());
        msg!("Buyer: {}, Price: {}, Expiry: {:?}", ctx.accounts.buyer.key(), purchase_price, expiry_timestamp);

        let licence = &mut ctx.accounts.licence;
        let clock = Clock::get()?;
        let buyer = &ctx.accounts.buyer;
        let token_program = &ctx.accounts.token_program;
        let buyer_token_account = &ctx.accounts.buyer_token_account;
        let certificate_details_account_info = &ctx.accounts.certificate_details;

        // 1. Validate purchase_price against expected price
        // Ensure the provided certificate_details account is owned by the correct program
        // Note: Anchor performs basic owner check if using Account<'info, CertificateDetails>,
        // but since we might use UncheckedAccount or need more checks, manual validation is safer.
        require_keys_eq!(
            certificate_details_account_info.owner.key(),
            CERTIFICATE_PROGRAM_ID.parse::<Pubkey>().unwrap(), // TODO: Handle parse error gracefully
            CreatorClaimLicenceError::CertificateMismatch // Reuse error or add specific one
        );

        // Load the certificate details data
        // Using AccountLoader for efficiency if state is large, or direct deserialization
        let cert_details_data = Account::<CertificateDetails>::try_from(certificate_details_account_info)?;

        // --- Price determination logic ---
        // TODO: Replace this placeholder with actual price lookup logic.
        // This might involve:
        //   a) A direct `price` field on CertificateDetails.
        //   b) A lookup based on `cert_details_data.licence_template_id`.
        let expected_price = 100 * 10**6; // Placeholder: e.g., 100 USDC
        msg!("Expected price (placeholder): {}", expected_price);
        // --- End Price determination ---

        require!(purchase_price == expected_price, CreatorClaimLicenceError::IncorrectPrice);
        msg!("Purchase price validated.");

        // 2. Perform payment transfer using Token-2022
        //    The standard `transfer` CPI is used. The Token-2022 program's transfer hook,
        //    configured on the mint (Transfer Fee extension), intercepts this call.
        //    It automatically deducts fees based on the mint's config and transfers them
        //    to the accounts provided in ctx.remaining_accounts.
        //    The remaining amount is transferred to the primary destination account
        //    (which needs to be determined - often a central escrow or the first recipient).
        //    For simplicity, we might initially transfer to a placeholder or treasury,
        //    assuming the hook handles the *actual* distribution.
        msg!("Initiating Token-2022 transfer of {} tokens from buyer {}.",
             purchase_price, buyer_token_account.key());
        msg!("Transfer hook expected to distribute fees to accounts in remaining_accounts.");

        // *** Crucial: The recipient account (`to`) in this primary transfer matters. ***
        // It receives the amount *after* fees are deducted by the hook.
        // This should likely be a designated recipient or escrow account.
        // For now, using a placeholder recipient from remaining_accounts if available,
        // otherwise erroring or using treasury. THIS NEEDS FINAL DESIGN.
        let primary_recipient_account_info = ctx.remaining_accounts.get(0)
            .ok_or_else(|| CreatorClaimLicenceError::MissingRecipientAccount)?;
        // TODO: Add validation that this primary_recipient is a valid TokenAccount

        let transfer_instruction = Transfer {
            from: buyer_token_account.to_account_info(),
            to: primary_recipient_account_info.to_account_info(), // Receives amount AFTER fees
            authority: buyer.to_account_info(),
        };

        // IMPORTANT: Pass ALL recipient accounts from remaining_accounts to the CPI context.
        // The transfer hook requires them.
        let mut cpi_ctx = CpiContext::new(token_program.to_account_info(), transfer_instruction);
        cpi_ctx = cpi_ctx.with_remaining_accounts(ctx.remaining_accounts.to_vec());

        token_2022::transfer(cpi_ctx, purchase_price)?;
        msg!("Token-2022 transfer initiated successfully. Hook should have processed fees.");

        // 3. Populate the Licence PDA data
        licence.certificate_details = ctx.accounts.certificate_details.key();
        licence.buyer = ctx.accounts.buyer.key();
        licence.purchase_price = purchase_price;
        licence.purchase_timestamp = clock.unix_timestamp;
        licence.expiry_timestamp = expiry_timestamp;
        licence.status = LicenceStatus::Active;
        licence.bump = ctx.bumps.licence;

        // 4. Emit event
        emit!(LicencePurchased {
            licence_pda: licence.key(),
            certificate_details: licence.certificate_details,
            buyer: licence.buyer,
            purchase_price,
            purchase_timestamp: licence.purchase_timestamp,
        });

        msg!("Licence PDA created: {}", licence.key());
        Ok(())
    }

    // TODO: Add revoke_licence instruction
    /// Instruction to revoke an existing licence.
    /// This can typically be called by the original content creator/authority
    /// or a designated platform admin in case of DMCA or other issues.
    ///
    /// Args:
    ///     ctx: Context containing accounts needed.
    ///
    /// Accounts:
    ///     revoker: The signer authorized to revoke the licence.
    ///     licence: The Licence PDA to be revoked (must be mutable).
    ///     certificate_details: The corresponding CertificateDetails account.
    ///                         Used to verify the revoker's authority.
    pub fn revoke_licence(ctx: Context<RevokeLicence>) -> Result<()> {
        msg!("Revoking licence PDA: {}", ctx.accounts.licence.key());

        let licence = &mut ctx.accounts.licence;
        let revoker = &ctx.accounts.revoker;
        let certificate_details = &ctx.accounts.certificate_details; // Assuming deserialized below

        // --- Authorization Check ---
        // We need to verify that the `revoker` is authorized.
        // This requires fetching the authority from the `certificate_details` account.
        // This is a cross-program invocation (CPI) or requires passing the deserialized account.
        // For simplicity here, we'll assume the check passes or use a placeholder.
        //
        // Example (Conceptual - requires CertificateDetails struct definition and account data):
        // let cert_auth = certificate_details.authority; // Assuming certificate_details is deserialized
        // require!(revoker.key() == cert_auth || revoker.key() == ADMIN_PUBKEY, LicenceError::UnauthorizedRevoker);
        msg!("Revoker {} authorized (placeholder check).", revoker.key());

        // --- Check Licence Status ---
        require!(licence.status == LicenceStatus::Active, CreatorClaimLicenceError::LicenceRevoked); // Or LicenceExpired?

        // --- Update Status ---
        licence.status = LicenceStatus::Revoked;
        msg!("Licence status updated to Revoked.");

        // --- Emit Event ---
        emit!(LicenceRevoked {
            licence_pda: licence.key(),
            certificate_details: licence.certificate_details, // Already stored on licence
            revoker: revoker.key(),
        });

        Ok(())
    }
}

/// Context for the `purchase_licence` instruction (Updated for Token-2022).
#[derive(Accounts)]
#[instruction(purchase_price: u64, expiry_timestamp: Option<i64>)]
pub struct PurchaseLicence<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut,
        token::program = token_program, // Use Token-2022 program ID
        token::mint = payment_mint
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// Initialize the Licence PDA.
    /// Seeds ensure uniqueness per certificate per buyer.
    #[account(
        init,
        payer = buyer,
        space = Licence::LEN,
        seeds = [b"licence", certificate_details.key().as_ref(), buyer.key().as_ref()],
        bump,
        owner = system_program.key()
    )]
    pub licence: Account<'info, Licence>,

    /// Certificate Details account. Need its data to validate price.
    #[account(
        // Ensure owner is the certificate program
        owner = CERTIFICATE_PROGRAM_ID.parse::<Pubkey>().unwrap() // TODO: Handle parse error
    )]
    pub certificate_details: Account<'info, CertificateDetails>,

    /// The Token-2022 Mint configured with the Transfer Fee extension.
    #[account(token::program = token_program)] // Check ownership by Token-2022
    pub payment_mint: Account<'info, Mint>,

    /// The Token-2022 Program itself.
    #[account(address = TOKEN_2022_PROGRAM_ID)]
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    // Royalty recipient accounts, treasury account, etc., must be passed
    // in ctx.remaining_accounts in the order expected by the transfer hook.
}

/// Context for the `revoke_licence` instruction.
#[derive(Accounts)]
pub struct RevokeLicence<'info> {
    /// The signer attempting to revoke the licence.
    /// Must have authority (e.g., be the authority stored in CertificateDetails).
    pub revoker: Signer<'info>,

    /// The licence account to be modified.
    /// Ensure it's owned by this program (implicit check via Account type).
    #[account(mut,
        // Constraint to ensure this licence belongs to the provided certificate_details key
        constraint = licence.certificate_details == certificate_details.key() @ CreatorClaimLicenceError::CertificateMismatch
    )]
    pub licence: Account<'info, Licence>,

    /// The CertificateDetails account associated with the licence.
    /// Used to verify if the `revoker` has the correct authority.
    #[account(
        // TODO: Add constraint to check owner is the certificate program ID once known and imported.
        // owner = CERTIFICATE_PROGRAM_ID.parse::<Pubkey>().unwrap() @ CreatorClaimLicenceError::CertificateMismatch,
        // Ensure the key matches the one stored in the licence account (redundant due to above constraint but good practice).
         constraint = licence.certificate_details == certificate_details.key() @ CreatorClaimLicenceError::CertificateMismatch
    )]
    /// CHECK: Deserialization needed to check authority field against revoker.
    pub certificate_details: UncheckedAccount<'info>,
}

// --- Events ---
#[event]
pub struct LicencePurchased {
    pub licence_pda: Pubkey,
    pub certificate_details: Pubkey,
    pub buyer: Pubkey,
    pub purchase_price: u64,
    pub purchase_timestamp: i64,
}

#[event]
pub struct LicenceRevoked {
    pub licence_pda: Pubkey,
    pub certificate_details: Pubkey,
    pub revoker: Pubkey, // Who triggered the revoke (admin or creator)
}

// Add new error for missing recipient account
#[error_code]
pub enum CreatorClaimLicenceError {
    // ... (existing errors) ...
    #[msg("Primary recipient account missing from remaining_accounts.")]
    MissingRecipientAccount,
    #[msg("Incorrect purchase price provided.")]
    IncorrectPrice,
}