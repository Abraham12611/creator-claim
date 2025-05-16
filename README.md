# CreatorClaim – Real‑Time Licensing & Royalty Engine for Creators
*A Solana‑powered platform that turns every creative work into a traceable, instantly‑paid asset.*

![CreatorClaim Banner](https://i.ibb.co/gb8kzHYV/CC-banner.png)

<p align="center">
  <a href="https://twitter.com/CreatorClaim">Twitter</a> • <a href="https://creatorclaim.com">Website</a>
</p>

## Table of Contents

* [Overview](#overview)
* [Smart Contract Architecture](#smart-contract-architecture)
* [Creator Workflows](#creator-workflows)
* [Buyer Workflows](#buyer-workflows)

## Overview

CreatorClaim is a **real-time licensing and royalty platform** built on Solana, designed to revolutionize how digital content is licensed and monetized. It enables creators to tokenize their work as **"Certificates"** and offer **on-chain licenses** to buyers with automated royalty splits. All royalties are distributed in seconds, leveraging Solana's speed and the new Token-2022 standard for transparent fee-splitting. The result is a next-generation marketplace where creators earn **instant payouts** on license purchases, and buyers receive cryptographic proof of their usage rights.

## Integrations

### Solana
CreatorClaim implements a comprehensive integration with the Solana blockchain, providing a robust foundation for digital content licensing and royalty distribution. The integration includes wallet management, transaction handling, and advanced token functionality.

Implementation details can be found here:
- [Wallet Adapter](https://github.com/Abraham12611/creator-claim/blob/main/frontend/app/providers.tsx): Core wallet connection and management
- [Token-2022 Program](https://github.com/Abraham12611/creator-claim/blob/main/programs/creatorclaim_certificate/src/lib.rs): Implementation of Token-2022 standard for royalty distribution
- [SPL Account Compression](https://github.com/Abraham12611/creator-claim/blob/main/programs/creatorclaim_certificate/src/lib.rs): Compressed NFT implementation for efficient storage

The integration offers several key components:

1. **Wallet Connectivity**
   - Custom wallet strategy implementation for secure connections
   - Support for multiple wallet providers
   - Transaction signing and management

2. **Token Management**
   - Token-2022 standard implementation for advanced token features
   - Compressed NFT (cNFT) support for efficient storage
   - Automated royalty distribution

3. **Transaction Handling**
   - Support for complex transaction building
   - Transaction signing with proper fee estimation
   - Event monitoring and webhook integration

### Arweave
CreatorClaim leverages Arweave for permanent, decentralized storage of digital content and metadata. The integration ensures content immutability and accessibility.

Implementation details can be found here:
- [Metadata Service](https://github.com/Abraham12611/creator-claim/blob/main/main/metadata_service/src/uploader.ts): Core integration with Arweave for content storage
- [Frontend Integration](https://github.com/Abraham12611/creator-claim/blob/main/frontend/app/mint/page.tsx): Content upload and metadata management
- [History Service](https://github.com/Abraham12611/creator-claim/blob/main/frontend/app/history/page.tsx): Arweave GraphQL integration for content history

The integration provides:
1. **Content Storage**
   - Permanent storage of digital assets
   - Metadata management and indexing
   - Content retrieval and verification

2. **History Tracking**
   - Transaction history via Arweave GraphQL
   - Content versioning and updates
   - Cross-referencing with on-chain data

### Helius RPC
CreatorClaim uses Helius RPC for enhanced blockchain interaction and event monitoring.

Implementation details can be found here:
- [RPC Configuration](https://github.com/Abraham12611/creator-claim/blob/main/frontend/app/providers.tsx): Helius RPC endpoint configuration
- [Event Monitoring](https://github.com/Abraham12611/creator-claim/blob/main/frontend/components/RoyaltyWsClient.tsx): WebSocket integration for real-time updates

The integration offers:
1. **Enhanced RPC Access**
   - Optimized transaction processing
   - Advanced query capabilities
   - WebSocket support for real-time updates

2. **Event Monitoring**
   - Real-time transaction tracking
   - Custom webhook integration
   - Event filtering and processing

### Metaplex Bubblegum
CreatorClaim integrates with Metaplex Bubblegum for compressed NFT (cNFT) functionality.

Implementation details can be found here:
- [Certificate Program](https://github.com/Abraham12611/creator-claim/blob/main/programs/creatorclaim_certificate/src/lib.rs): cNFT implementation using Bubblegum
- [Frontend Integration](https://github.com/Abraham12611/creator-claim/blob/main/frontend/app/mint/page.tsx): cNFT minting and management

The integration provides:
1. **Compressed NFT Support**
   - Efficient storage of NFT data
   - Reduced on-chain costs
   - Enhanced scalability

2. **Metadata Management**
   - On-chain metadata handling
   - Off-chain metadata integration
   - URI management and updates

Key problems we solve:

* **Slow, Opaque Royalties:** Traditional licensing payouts can take months. CreatorClaim streams payments to creators in real-time, with on-chain transparency.
* **Complex Rights Management:** We provide standardized license templates (e.g. Non-Exclusive, Exclusive, Editorial), ensuring clarity on how content can be used.
* **High Fees & Middlemen:** Our on-chain royalty router removes intermediaries – a buyer's payment goes directly to creators and stakeholders per predefined splits, enforced by Solana programs.

![System Diagram](https://i.ibb.co/q3z7F2N6/system-image-cc.png)
*High-level system diagram: creators mint Certificates on-chain and upload assets off-chain; buyers purchase licenses via the Solana programs; the indexer & API relay real-time updates to UIs.*


**How it works:**

* **For Creators:** Upload your digital asset (image, music, video, etc.) via the CreatorClaim web app. Choose a license template and set a price. The platform pins your content to decentralized storage (Arweave/IPFS) and mints a *compressed NFT* Certificate on Solana. An on-chain **CertificateDetails PDA** is created to record your asset's metadata hash, license terms ID, price, and royalty split configuration. Now your work is available for licensing, and you have a dashboard to track sales and royalties.
* **For Buyers:** Browse the CreatorClaim marketplace for content. When you find an asset to license, initiate a purchase through our web app. The app will prompt your Solana wallet for a transaction. Once approved, the on-chain **purchase_licence** instruction executes: your USDC (Token-2022) payment is transferred under the hood, and a **Licence PDA** is created as proof of your license. Royalties are automatically split and sent to the creator (and any collaborators) *within seconds*. You can then download the asset knowing you have a valid license on-chain.

CreatorClaim's novel use of **Solana's Compressed NFTs** and **SPL Token-2022** means it can handle high volumes (think thousands of licenses) with minimal fees, while preserving a transparent and tamper-proof record of content ownership and rights. It's composable with the Solana ecosystem – using standard tokens and NFTs allows integration with wallets, explorers, and other DeFi/NFT protocols. Whether you're a graphic artist licensing a design or a musician offering samples, CreatorClaim provides a **fast, fair, and secure** way to monetize creative work.

## Smart Contract Architecture

Under the hood, CreatorClaim consists of Solana programs (smart contracts) that manage **Certificates**, **Licences**, and automatic royalty distribution:

* **Certificate Program (creatorclaim_certificate)** – Handles creation of new Certificates for creative works. Each Certificate is represented by a *compressed NFT (cNFT)* on Solana and has an associated **CertificateDetails** account (a PDA). This PDA stores the metadata and financial info for the item:

  * *Authority:* The creator's Pubkey (who can manage the certificate).
  * *Metadata URI Hash:* A 32-byte SHA-256 hash of the off-chain metadata (ensuring the off-chain JSON/content hasn't been tampered with).
  * *License Template ID:* A `u16` that references which standardized license terms apply (maps to a legal template in our docs).
  * *Royalty Splits:* An array of up to 10 recipients (Pubkey + percentage) defining how royalties from each sale are split. This must sum to 100% (10,000 bps). For example, a creator could designate 80% to themselves, 15% to a co-creator, and 5% to the platform treasury.
  * *Price:* The price (in USDC smallest units, e.g. cents) required to purchase a license for this content.
  * All this fits in a compact account (~**427 bytes**), thanks to fixed-size limits (max 10 royalty recipients) for predictable storage.
    The Certificate program provides a `register_certificate` instruction (Anchor method) to create this account and mint the cNFT. It ensures inputs are valid (e.g., price > 0, royalty splits sum correctly) and emits a `NewCertificateRegistered` event for off-chain indexers. The actual NFT minting is done via CPI to Metaplex's Bubblegum program (state compression), so publishing a new asset is **low-cost and scalable**.

* **Licence Program (creatorclaim_licence)** – Manages the purchasing and lifecycle of content licenses. When a buyer purchases a license, this program:

  * Creates a **Licence** account (PDA) for that purchase, using seeds `[ "licence", certificate_details_pubkey, buyer_pubkey ]`. This ensures each buyer can have at most one active license per content certificate (idempotent licensing per user).
  * Transfers the payment from the buyer's Token-2022 USDC account. We leverage the **SPL Token-2022 Transfer Fee extension** as a built-in royalty distribution mechanism. The USDC mint is pre-configured with the creator's and collaborators' accounts as fee recipients according to the royalty splits. When the program invokes the token transfer, the Token-2022 program automatically distributes the fee splits to those accounts. This means royalties are paid out **within the same transaction** – no separate royalty settlement step needed! The net amount (after fees) goes to the primary recipient (e.g., the creator), and the rest goes to each split beneficiary as configured on the mint.
  * Records purchase details in the Licence PDA: it stores the `certificate_details` link, `buyer` pubkey, `purchase_price`, a `purchase_timestamp` (block time), an optional `expiry_timestamp` if the license is time-limited, and a status enum. This structure is very small (~**99 bytes**). If an expiry is set (e.g., a 1-year license), the program can mark the status as `Expired` once that time passes. By default, licenses are `Active`.
  * Emits a `LicencePurchased` event with the pertinent details (used by our indexer to notify the creator's dashboard in real-time).

  The Licence program also provides an admin/creator-only `revoke_licence` instruction. This can be used for compliance or takedown requests (DMCA). It requires the caller to be authorized (either the original Certificate authority or a designated admin) and will mark the Licence account's status as `Revoked`. A `LicenceRevoked` event is emitted, and UIs seeing this can disable the buyer's access to the content. Revocation doesn't claw back the payment (that's a complex area legally), but it does formally invalidate the usage rights going forward. In the UI, an admin dashboard would list all licenses and allow filtering by status, so admins can see any that were revoked or expired.

**On-Chain Technical Highlights:**

* **Program Derived Accounts (PDAs):** We use PDA seeds to ensure uniqueness and security. For example, `CertificateDetails` PDAs are derived from the certificate's asset ID (mint) ensuring a one-to-one mapping, and `Licence` PDAs are derived from (certificate, buyer) ensuring no duplicates. All PDAs and cross-program invocations include strict checks (correct seeds, program ownership, bump validation) to prevent spoofing.
* **SPL Token-2022 Integration:** By using the Token-2022 standard with its TransferFee feature, we achieve **atomic royalty distribution**. The royalty percentages are encoded in the token mint's metadata, so our program doesn't manually split payments (saving compute). This showcases composability: any Token-2022 wallet can handle the payment, and the logic is partly offloaded to a well-tested system program.
* **Compute & Size Efficiency:** Every on-chain instruction is optimized for the Solana runtime. The `register_certificate` and `purchase_licence` instructions are designed to stay within **1.4M Compute Units** each (Solana's limit per transaction). By using compression for NFTs and keeping account sizes small (Certificate < 0.5 KB, Licence ~0.1 KB), costs are kept minimal. On devnet, a full license purchase transaction executes in a few hundred milliseconds.
* **Robust Error Handling:** The programs define rich error codes for graceful failure cases. For example, `TooManyRecipients` or `InvalidRoyaltySum` if a creator provides a bad royalty configuration, `IncorrectPrice` if a buyer attempts a payment that doesn't match the asking price, or `UnauthorizedRevoker` if someone tries to revoke without permission. These errors help developers integrate with clear failure messages and help maintain contract integrity by catching misuses.
* **Security Considerations:** We employ checks for all signer and ownership requirements (e.g., ensuring the correct certificate account is used and the payer is the buyer during purchase). We've also integrated a `solana_security_txt` in each program, indicating our security contact and policy (important for mainnet deployment). Upgradability is secured under a controlled authority (with a plan to transition to a DAO or multisig post-hackathon). All actions (mint, purchase, revoke) emit events, enabling full transparency and off-chain auditability of the system's activity.

To illustrate the simplicity of integration, here's a pseudo-code snippet using Anchor's TypeScript SDK to call the `register_certificate` instruction (creator minting a new Certificate):

```ts
// Assume we have Anchor Provider and IDLs set up for the certificate program
const certificateProgram = new Program<CreatorClaimCertificateIDL>(idl, CERTIFICATE_PROGRAM_ID, provider);

// Prepare data for a new certificate
const metadataHash = [...];  // 32-byte SHA-256 hash of metadata URI
const licenceTemplateId = 1; // e.g., 1 = Standard Non-Exclusive License
const price = 100_00;       // e.g., 100.00 USDC = 10000 cents (u64 value)
const royaltySplits = [
  { beneficiary: creatorPubkey, shareBps: 8000 },    // 80%
  { beneficiary: coCreatorPubkey, shareBps: 2000 }   // 20%
];

// Derive the PDA for CertificateDetails (seed: "certificate_details" + assetMintPubkey)
const [certificatePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("certificate_details"), assetMintPubkey.toBuffer()],
  CERTIFICATE_PROGRAM_ID
);

// Call the register_certificate instruction
await certificateProgram.methods
  .registerCertificate(metadataHash, licenceTemplateId, new anchor.BN(price), royaltySplits)
  .accounts({
    creator: provider.wallet.publicKey,
    certificateDetails: certificatePda,
    assetIdOrMintPk: assetMintPubkey,
    systemProgram: SystemProgram.programId
  })
  .rpc();
```

In the above snippet, the creator provides the metadata, template, price, and splits. The program allocates the account and links the compressed NFT asset. Similar patterns apply for the `purchase_licence` call on the buyer side, demonstrating how *developer-friendly* and composable our system is using Anchor.

## Creator Workflows

From a creator's perspective, CreatorClaim offers a seamless process to monetize content. Below we outline the typical journey and how the system handles each step:

1. **Upload & Metadata Pinning:** The creator uses the web app to upload their media file (or provide a URI). This content is automatically pinned to decentralized storage (via Arweave/Bundlr or IPFS) through our API service. Metadata (title, description, tags, etc.) is generated, and a unique URI is produced. The UI may show a preview of the content and have the creator fill in details like title and description.

2. **Choose License Terms & Price:** The creator selects a license template that suits their needs. For instance, **Standard Non-Exclusive** allows multiple buyers to license the work, whereas **Exclusive Buy-Out** might allow only one buyer to ever license it. These templates are predefined legal contracts (stored off-chain, with an on-chain ID reference). The creator sets the price in USD (which the app converts to the appropriate on-chain token amount). They can also set how they want royalties split if there are multiple beneficiaries (the UI provides fields to add collaborators and percentages).

3. **Mint Certificate (On-Chain):** When ready, the creator hits "Publish" (or "Mint Certificate"). The front-end gathers all necessary info and sends a transaction to the Solana cluster:

   * The **register_certificate** instruction is invoked, creating the CertificateDetails account and minting the compressed NFT.
   * The creator's wallet signs this transaction, paying the small network fee and rent for the PDA.
   * In real-time, the UI updates to indicate the transaction is confirmed (we listen to the confirmation via WebSocket or polling). Once confirmed, the new Certificate is live on-chain.

4. **Dashboard & Real-Time Royalties:** After minting, the creator can see their content listed in their **Creator Dashboard** with status "Active" and the set price. When buyers start licensing the content, the creator's dashboard will update **in real-time**. Our indexer service listens to `LicencePurchased` events; when a sale occurs, the indexer notifies the API, which then pushes a WebSocket message to the creator's browser. The dashboard will show a new entry like "License sold to BuyerX – $100.00 – Royalty Earned: $80.00" almost instantly. The earned royalties (e.g., $80 in USDC) are already in the creator's wallet by the time they see the notification, courtesy of the on-chain royalty mechanism.

5. **Earnings & Analytics:** The platform provides tools for creators to track their total earnings, number of licenses sold, and content performance. Because every license is an on-chain record, creators can even independently verify their revenue stream on Solana (through the blockchain explorer or querying the program accounts). For convenience, the dashboard will allow exporting earnings data (with planned features like generating a **1099-K** or **DAC7** report for taxes, per jurisdiction).

![Creator Dashboard](https://i.ibb.co/YFQr26cj/cc-ss-1.png)


6. **Content Management:** Creators remain in control. If needed, a creator can update certain aspects (we plan an instruction to update price or metadata hash if absolutely required, given appropriate permissions). If a creator must revoke a license (say a misuse or a breach of terms by a buyer), they can coordinate with platform admins to call the `revoke_licence` instruction – after which that buyer's license status flips to revoked (the dashboard would reflect this change too). In future updates, creators will also be able to issue new content or retire old content easily, all from this unified interface.

Throughout the above workflow, we emphasize **ease-of-use and speed**. The creator doesn't need to understand Solana intricacies – they get a user-friendly app – but under the hood they benefit from trustless infrastructure:

* **Instant Payment:** No more waiting for quarterly reports – each license triggers an immediate payment split.
* **Transparency:** Every sale and royalty share is recorded on-chain. Creators have cryptographic assurance of their share (and so do any collaborators).
* **Low Fees:** By using Solana's high throughput and compression, minting and selling incur negligible fees (often fractions of a cent), maximizing the creator's profit.

## Buyer Workflows

For content buyers (licensees), CreatorClaim offers a familiar e-commerce-like experience enhanced by the security of blockchain. Here's what the process looks like for a buyer:

1. **Discovery & Preview:** Buyers can browse the CreatorClaim marketplace by category, search keywords, or see featured content. Each asset listing displays a preview (e.g., low-res image or watermarked video), the name/description, the creator, the license type, and the price. Buyers can click on a listing to see more details, including the summary of license terms (e.g., "You may use this asset for commercial projects. No resale or sub-licensing. Creator retains ownership.") derived from the license template.

2. **Wallet Connection:** When a buyer is ready to purchase a license, they are prompted to connect their Solana wallet (if not already connected). We support standard wallets via Solana Wallet Adapter (Phantom, Solflare, etc.). The platform will detect if the buyer has the required USDC (Token-2022) balance. If not, instructions could be provided to acquire or wrap USDC on devnet/testnet for the demo.

3. **Checkout & License Confirmation:** Upon clicking "Purchase License," a checkout modal appears summarizing the purchase:

   * Asset name, creator, and a link to view full license terms.
   * Price in USDC (e.g., 100 USDC).
   * Royalty breakdown (if the UI chooses to display, e.g., "80 USDC to Creator, 20 USDC to Collaborator/Platform" for transparency).
   * The buyer confirms and the app creates a transaction to call the **purchase_licence** instruction on-chain. The transaction is presented to the buyer's wallet for approval.
   * After approval, within a couple of seconds the transaction confirms. The buyer sees a success message "License purchased!" and the UI now provides access to download the high-quality asset file.

![Licence Purchase Modal](https://i.ibb.co/nNMCzQb1/cc-ss-2.png)


4. **Automatic Royalty Distribution:** From the buyer's perspective, this step is seamless – they just paid the price. But it's worth noting what happened in that single transaction:

   * The buyer's USDC was debited and simultaneously split: the creator and any collaborators received their shares *immediately on-chain*. The buyer could even see the breakdown by looking at the transaction details (multiple outputs) on a Solana explorer.
   * A new **Licence account** was created on-chain representing the buyer's license. This is their proof-of-license. It's not something the buyer needs to manage like a token or NFT in their wallet (currently we don't mint a separate NFT for the license to avoid clutter; the on-chain record is sufficient), but it's there for transparency and can be referenced if needed (each Licence PDA has a unique address).

5. **Download & Usage:** With purchase complete, the buyer can now download the asset immediately from the CreatorClaim platform. The download link is enabled by the backend once on-chain confirmation is received (ensuring the payment went through). Because the licensing is now valid, the buyer can use the content per the agreed terms. For example, if it's a stock photo with a standard license, they can use it in their project. If the license was time-limited, the buyer might see an expiry date in their dashboard or email confirmation, and they know they'd need to renew after that date for continued use.

6. **Buyer's License Management:** Buyers will have their own dashboard (planned feature) where they can see all the licenses they've purchased, including details and statuses. This is especially useful for businesses or frequent purchasers to keep track of usage rights. If a license is revoked or expires, the buyer is notified there and via email, maintaining open communication. Because everything is on-chain, there's no ambiguity – a buyer can prove they licensed a piece of content at a certain time, which can be useful if ever challenged.

Why buyers will love CreatorClaim:

* **Instant Access:** No waiting for manual approval – once the blockchain transaction confirms (usually a few seconds), the content is unlocked.
* **Trust & Compliance:** The license terms are clear and were the basis of a smart contract transaction. Buyers know the creator has agreed and will be paid – reducing potential disputes. The blockchain acts as an impartial ledger of the agreement.
* **Ease of Use:** The flow is very similar to a normal online purchase with a credit card, but using a crypto wallet. For crypto-native users, it's straightforward; for non-crypto users, we could integrate wallet-onboarding or custodial options in the future (so they may not even realize it's on-chain).
* **Global & Efficient:** Using USDC on Solana means no currency conversion fuss for international transactions, and negligible transaction fees (usually <$0.01), which are often absorbed by the platform for a smooth UX.
