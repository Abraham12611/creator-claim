use anchor_lang::prelude::*;

// Make state and errors available
mod state;
use state::*;

declare_id!("CERTxxxxxxxxxxxxxxxxxx"); // Replace with actual Program ID after deploy

// Define the program ID for use in constraints
#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "CreatorClaim Certificate Program",
    project_url: "http://example.com", // TODO: Replace with actual URL
    contacts: "email:security@example.com", // TODO: Replace with actual contact
    policy: "https://example.com/security-policy", // TODO: Replace with actual URL
    preferred_languages: "en"
}

#[program]
pub mod creatorclaim_certificate {
    use super::*; // Make outer scope (state, errors) available

    /// Instruction to register the details of a creative work.
    /// This creates the CertificateDetails PDA associated with the work.
    ///
    /// Args:
    ///     ctx: Context containing accounts needed for the instruction.
    ///     metadata_uri_hash: The SHA-256 hash of the off-chain metadata URI.
    ///     licence_template_id: The ID of the licence template.
    ///     price: The price required to purchase a licence (e.g., in USDC cents).
    ///     royalty_splits: The vector defining royalty distribution.
    ///
    /// Accounts:
    ///     creator: The signer creating the certificate details, pays for account rent.
    ///     certificate_details: The PDA account to be initialized.
    ///         Seeds: ["certificate_details", asset_id_or_mint_pk.key().as_ref()]
    ///         Payer: creator
    ///         Space: CertificateDetails::LEN
    ///     asset_id_or_mint_pk: An account representing the unique asset (e.g., the cNFT mint pubkey).
    ///                            Used as a seed for the PDA. Could be any unique identifier account.
    ///     system_program: Required by Anchor for creating accounts.
    pub fn register_certificate(
        ctx: Context<RegisterCertificate>,
        metadata_uri_hash: [u8; 32],
        licence_template_id: u16,
        price: u64,
        royalty_splits: Vec<RoyaltySplit>,
    ) -> Result<()> {

        // Validate inputs
        require!(
            metadata_uri_hash != [0u8; 32],
            CreatorClaimCertificateError::MissingMetadataHash
        );
        require!(price > 0, CreatorClaimCertificateError::ZeroPriceNotAllowed);
        CertificateDetails::validate_splits(&royalty_splits)?;

        // Get the certificate_details account from the context
        let certificate_details = &mut ctx.accounts.certificate_details;

        // Populate the account data
        certificate_details.authority = ctx.accounts.creator.key();
        certificate_details.metadata_uri_hash = metadata_uri_hash;
        certificate_details.licence_template_id = licence_template_id;
        certificate_details.price = price;
        certificate_details.royalty_splits = royalty_splits;
        certificate_details.bump = ctx.bumps.certificate_details; // Anchor automatically gets bump

        msg!("Certificate details registered for asset: {}", ctx.accounts.asset_id_or_mint_pk.key());
        emit!(NewCertificateRegistered {
            asset_id: ctx.accounts.asset_id_or_mint_pk.key(),
            creator: ctx.accounts.creator.key(),
            licence_template_id,
            price,
        });

        Ok(())
    }

    // Potentially add other instructions later:
    // - update_authority(...)
    // - update_metadata_hash(...)
}

/// Context for the `register_certificate` instruction.
#[derive(Accounts)]
#[instruction(metadata_uri_hash: [u8; 32], licence_template_id: u16, price: u64, royalty_splits: Vec<RoyaltySplit>)]
pub struct RegisterCertificate<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Initialize the PDA account for certificate details.
    /// Seeds constraint ensures PDA is derived correctly.
    /// Space constraint ensures enough space is allocated.
    /// Owner constraint ensures the account belongs to this program.
    #[account(
        init,
        payer = creator,
        space = CertificateDetails::LEN,
        seeds = [b"certificate_details", asset_id_or_mint_pk.key().as_ref()],
        bump,
        owner = system_program.key() // Initial owner is system program for `init`
        // After init, the owner will be this program's ID. Anchor handles the final owner check implicitly.
    )]
    pub certificate_details: Account<'info, CertificateDetails>,

    /// CHECK: This account solely provides a unique key for the PDA seed.
    /// The key of this account is used as a seed for the `certificate_details` PDA.
    /// It MUST be a unique identifier for the creative work (e.g., the cNFT mint address).
    /// No data is read or written from this account within this instruction,
    /// and no ownership or type checks are performed here.
    /// Assumption: The caller provides the correct, unique public key representing the asset.
    /// Risk: If a non-unique key is provided, it could lead to PDA collisions or incorrect association.
    /// Future Enhancement: If needed, add constraints here to verify it's a valid Mint address
    /// owned by the appropriate token/NFT program, but this increases complexity.
    pub asset_id_or_mint_pk: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// Define events to be emitted
#[event]
pub struct NewCertificateRegistered {
    pub asset_id: Pubkey,           // The unique identifier (e.g., cNFT mint)
    pub creator: Pubkey,
    pub licence_template_id: u16,
    pub price: u64,
    // Consider adding metadata_uri_hash if useful for off-chain indexers
}

// Add new error code
#[error_code]
pub enum CreatorClaimCertificateError {
    #[msg("Price cannot be zero.")]
    ZeroPriceNotAllowed,
}