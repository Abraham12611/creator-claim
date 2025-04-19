use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Make state and errors available
mod state;
use state::*;

// Import the certificate program ID to check ownership (replace with actual ID)
// This requires the certificate program crate to be a dependency in Cargo.toml
// and correctly declared in Anchor.toml [programs.cluster]
// use creatorclaim_certificate;

// Placeholder for actual Certificate Program ID
// In a real setup, this would likely be imported or defined globally.
// declare_id!("CERTxxxxxxxxxxxxxxxxxx"); // Example ID for certificate program
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

    /// Instruction to purchase a licence for a creative work.
    /// This creates the Licence PDA, transfers payment (USDC), and triggers royalty distribution.
    ///
    /// Args:
    ///     ctx: Context containing accounts needed.
    ///     purchase_price: The agreed price (should match expected price based on template/certificate).
    ///     expiry_timestamp: Optional expiry for time-limited licences.
    ///
    /// Accounts:
    ///     buyer: The signer purchasing the licence, pays for account rent and fees.
    ///     buyer_token_account: The buyer's token account (USDC) to pay from.
    ///     licence: The Licence PDA to be initialized.
    ///         Seeds: ["licence", certificate_details.key().as_ref(), buyer.key().as_ref()]
    ///     certificate_details: The CertificateDetails account for the work being licensed.
    ///                        Used for PDA seed and potentially validation.
    ///     treasury_token_account: The platform's treasury account (USDC) to receive fees.
    ///     payment_mint: The mint address of the payment token (e.g., USDC).
    ///     token_program: SPL Token program.
    ///     system_program: System program for account creation.
    ///     // TODO: Add accounts for royalty recipients' token accounts
    ///     // TODO: Add account for the Royalty Router program (if using Token-2022 Transfer Hook, might be different)
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
        let treasury_token_account = &ctx.accounts.treasury_token_account;

        // 1. TODO: Validate purchase_price against expected price from CertificateDetails/Template
        //    - This would involve deserializing certificate_details account and checking a price field
        //      or deriving price based on licence_template_id.
        //    - Example: let cert_details_data = CertificateDetails::try_deserialize(&mut ctx.accounts.certificate_details.data.borrow())?;
        //              require!(purchase_price == cert_details_data.price, LicenceError::IncorrectPrice);

        // 2. Perform payment transfer (Buyer -> Treasury - Placeholder for now)
        //    In the final version, this transfer will trigger the Token-2022 Transfer Hook
        //    or potentially transfer to an escrow before manual splitting.
        msg!("Transferring {} tokens from buyer {} to treasury {}",
             purchase_price, buyer_token_account.key(), treasury_token_account.key());

        let cpi_accounts = Transfer {
            from: buyer_token_account.to_account_info(),
            to: treasury_token_account.to_account_info(), // Simple transfer to treasury for now
            authority: buyer.to_account_info(), // Buyer authorizes the transfer from their account
        };
        let cpi_program = token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, purchase_price)?;
        msg!("Transfer complete.");

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

/// Context for the `purchase_licence` instruction.
#[derive(Accounts)]
#[instruction(purchase_price: u64, expiry_timestamp: Option<i64>)]
pub struct PurchaseLicence<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut,
        // Ensure the buyer token account is owned by the token program
        token::program = token_program,
        // Optional: Ensure it's for the correct mint (USDC)
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

    /// CHECK: We use the key for PDA derivation. Could add constraints later
    /// like checking owner is the certificate program ID.
    /// #[account(owner = CERTIFICATE_PROGRAM_ID.parse::<Pubkey>().unwrap())] // Example owner check
    pub certificate_details: UncheckedAccount<'info>, // Links to the specific work being licensed

    #[account(mut,
        // Ensure the treasury token account is owned by the token program
        token::program = token_program,
        // Optional: Ensure it's for the correct mint (USDC)
        token::mint = payment_mint
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    // TODO: Add remaining accounts for royalty recipients
    // Example: #[account(mut)] pub royalty_recipient_1_token_account: Account<'info, TokenAccount>,
    // These might need to be passed in ctx.remaining_accounts depending on design.

    #[account(token::program = token_program)] // Ensure mint is owned by token program
    pub payment_mint: Account<'info, Mint>, // e.g., USDC mint
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
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