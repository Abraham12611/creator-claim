use anchor_lang::prelude::*;

// Constants
const MAX_RECIPIENTS: usize = 10; // As per rfc-001.md Q4

/// Represents a single royalty recipient and their share.
/// Pubkey + u16 = 32 + 2 = 34 bytes.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct RoyaltySplit {
    /// The public key of the royalty recipient.
    pub beneficiary: Pubkey,
    /// The share in basis points (bps). 10_000 = 100%.
    pub share_bps: u16,
}

/// Holds the core details associated with a CreatorClaim certificate (likely a cNFT).
/// Seeds: ["certificate_details", cnft_mint_or_asset_id]
/// Size Estimation:
/// - Discriminator: 8 bytes
/// - Authority (creator/minter): 32 bytes
/// - Metadata URI Hash (e.g., SHA-256): 32 bytes
/// - Licence Template ID: 2 bytes (u16 allows for 65k templates)
/// - Royalty Splits Vec Prefix: 4 bytes
/// - Royalty Splits Data: MAX_RECIPIENTS * sizeof(RoyaltySplit) = 10 * 34 = 340 bytes
/// - Bump: 1 byte
/// Total ~ 8 + 32 + 32 + 2 + 4 + 340 + 1 = 419 bytes (well under 10 KiB limit)
#[account]
#[derive(Debug)]
pub struct CertificateDetails {
    /// The authority allowed to manage/update aspects (initially the creator).
    pub authority: Pubkey,
    /// A hash of the off-chain metadata URI (e.g., Arweave/IPFS link).
    /// Ensures integrity of linked metadata (description, image, etc.).
    pub metadata_uri_hash: [u8; 32],
    /// Identifier for the licence template governing this work (maps to PRD Appendix 12.1).
    pub licence_template_id: u16,
    /// Array defining how royalties are split among recipients.
    /// Must sum to 10,000 bps at creation. Limited length for deterministic sizing.
    pub royalty_splits: Vec<RoyaltySplit>,
    /// Bump seed for the PDA.
    pub bump: u8,
}

impl CertificateDetails {
    // Calculate space needed, including Vec discriminator
    pub const LEN: usize = 8 // Discriminator
        + 32 // authority (Pubkey)
        + 32 // metadata_uri_hash ([u8; 32])
        + 2 // licence_template_id (u16)
        + 4 // royalty_splits Vec prefix (u32)
        + (MAX_RECIPIENTS * (32 + 2)) // Max size for Vec<RoyaltySplit> data
        + 1; // bump (u8)

    /// Validates that the royalty splits sum exactly to 10,000 bps
    /// and do not exceed the maximum number of recipients.
    pub fn validate_splits(splits: &[RoyaltySplit]) -> Result<()> {
        require!(
            splits.len() <= MAX_RECIPIENTS,
            CreatorClaimCertificateError::TooManyRecipients
        );

        let total_bps: u16 = splits.iter().map(|s| s.share_bps).sum();
        require!(
            total_bps == 10_000,
            CreatorClaimCertificateError::InvalidRoyaltySum
        );

        // Optional: Check for duplicate beneficiaries if needed
        // let mut unique_beneficiaries = std::collections::HashSet::new();
        // for split in splits {
        //     if !unique_beneficiaries.insert(split.beneficiary) {
        //         // return err!(CreatorClaimCertificateError::DuplicateBeneficiary);
        //     }
        // }


        Ok(())
    }
}


// Define custom errors for the program
#[error_code]
pub enum CreatorClaimCertificateError {
    #[msg("Royalty splits must sum to exactly 10,000 basis points.")]
    InvalidRoyaltySum,
    #[msg("Cannot have more than 10 royalty recipients.")]
    TooManyRecipients,
    #[msg("Metadata hash cannot be empty.")]
    MissingMetadataHash,
    // Add other specific errors as needed
}