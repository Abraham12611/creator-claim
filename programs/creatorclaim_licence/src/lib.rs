use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// Make state and errors available
mod state;
use state::*;

// Assuming the Certificate program's details are needed for validation
// Need to import the CertificateDetails struct if we check it directly
// For now, we might just rely on the PDA derivation using its pubkey.
// use creatorclaim_certificate::state::CertificateDetails; // Example if needed

declare_id!("LICxxxxxxxxxxxxxxxxxx"); // Replace with actual Program ID after deploy

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

        // 1. TODO: Validate purchase_price against expected price from CertificateDetails/Template

        // 2. TODO: Perform payment transfer (Buyer -> Escrow or directly to splits + treasury)
        //    - This will likely involve CPI to the SPL Token program.
        //    - If using Token-2022 Transfer Hook, the transfer itself triggers splits.
        //    - If manual split, transfer to an escrow PDA then CPI to Token program multiple times.
        // Example (Manual Transfer - Conceptual):
        // let cpi_accounts = Transfer {
        //     from: ctx.accounts.buyer_token_account.to_account_info(),
        //     to: ctx.accounts.treasury_token_account.to_account_info(), // Placeholder - needs actual logic
        //     authority: ctx.accounts.buyer.to_account_info(),
        // };
        // let cpi_program = ctx.accounts.token_program.to_account_info();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // token::transfer(cpi_ctx, purchase_price)?;

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
    // pub fn revoke_licence(ctx: Context<RevokeLicence>) -> Result<()> { ... }
}

/// Context for the `purchase_licence` instruction.
#[derive(Accounts)]
#[instruction(purchase_price: u64, expiry_timestamp: Option<i64>)]
pub struct PurchaseLicence<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)] // Buyer's token account needs to be mutable for transfer
    pub buyer_token_account: Account<'info, TokenAccount>,

    /// Initialize the Licence PDA.
    /// Seeds ensure uniqueness per certificate per buyer.
    #[account(
        init,
        payer = buyer,
        space = Licence::LEN,
        seeds = [b"licence", certificate_details.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub licence: Account<'info, Licence>,

    /// CHECK: We use the key for PDA derivation. Could add constraints later
    /// e.g., check owner is the certificate program ID.
    /// #[account(owner = creatorclaim_certificate::ID)] // Example if needed
    pub certificate_details: UncheckedAccount<'info>, // Links to the specific work being licensed

    #[account(mut)] // Treasury receives fees
    pub treasury_token_account: Account<'info, TokenAccount>,

    // TODO: Add remaining accounts for royalty recipients
    // Example: #[account(mut)] pub royalty_recipient_1_token_account: Account<'info, TokenAccount>,
    // These might need to be passed in ctx.remaining_accounts depending on design.

    pub payment_mint: Account<'info, Mint>, // e.g., USDC mint
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// TODO: Define Context for `revoke_licence`
// #[derive(Accounts)]
// pub struct RevokeLicence<'info> { ... }

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