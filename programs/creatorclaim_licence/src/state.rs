use anchor_lang::prelude::*;

/// Represents the state of a purchased licence.
/// Seeds: ["licence", certificate_details_pk.key().as_ref(), buyer_pk.key().as_ref()]
/// Size Estimation:
/// - Discriminator: 8 bytes
/// - Certificate Details Pubkey: 32 bytes (links to the specific work)
/// - Buyer Pubkey: 32 bytes
/// - Purchase Price (USDC): 8 bytes (u64)
/// - Purchase Timestamp: 8 bytes (i64)
/// - Expiry Timestamp (optional): 1 + 8 = 9 bytes (Option<i64>)
/// - Status (Active, Revoked): 1 byte (enum)
/// - Bump: 1 byte
/// Total ~ 8 + 32 + 32 + 8 + 8 + 9 + 1 + 1 = 99 bytes (very small)
#[account]
#[derive(Debug)]
pub struct Licence {
    /// The public key of the CertificateDetails account this licence pertains to.
    pub certificate_details: Pubkey,
    /// The public key of the wallet that purchased the licence.
    pub buyer: Pubkey,
    /// The price paid for the licence (e.g., in USDC cents or smallest unit).
    pub purchase_price: u64,
    /// Unix timestamp of when the licence was purchased.
    pub purchase_timestamp: i64,
    /// Optional Unix timestamp when the licence expires. None means perpetual.
    pub expiry_timestamp: Option<i64>,
    /// The current status of the licence.
    pub status: LicenceStatus,
    /// Bump seed for the PDA.
    pub bump: u8,
}

impl Licence {
    // Calculate space needed
    pub const LEN: usize = 8 // Discriminator
        + 32 // certificate_details (Pubkey)
        + 32 // buyer (Pubkey)
        + 8 // purchase_price (u64)
        + 8 // purchase_timestamp (i64)
        + 1 + 8 // expiry_timestamp (Option<i64>)
        + 1 // status (enum)
        + 1; // bump (u8)
}

/// Defines the possible statuses of a licence.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum LicenceStatus {
    Active,   // The licence is valid and in effect.
    Revoked,  // The licence has been revoked (e.g., due to DMCA).
    Expired,  // The licence term has ended.
}

// Define custom errors for the licence program
#[error_code]
pub enum CreatorClaimLicenceError {
    #[msg("Licence has expired.")]
    LicenceExpired,
    #[msg("Licence has been revoked.")]
    LicenceRevoked,
    #[msg("Insufficient funds for purchase.")]
    InsufficientFunds,
    #[msg("The provided certificate details account does not match.")]
    CertificateMismatch,
    #[msg("The buyer account does not match.")]
    BuyerMismatch,
    #[msg("Royalty split calculation error.")]
    RoyaltySplitError,
    // Add other specific errors as needed
}