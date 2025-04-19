import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { CreatorclaimCertificate } from "../target/types/creatorclaim_certificate";
import { assert } from "chai";
import "mocha";

// Define the RoyaltySplit structure expected by the program (matching state.rs)
// This helps TypeScript understand the structure even if IDL types aren't fully resolved yet.
interface RoyaltySplitInput {
  beneficiary: web3.PublicKey;
  shareBps: number | anchor.BN; // Allow number or BN
}

// Helper function to generate a random SHA-256 hash (as [u8; 32])
const generateRandomHash = (): number[] => {
  const buffer = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  // Ensure it's not all zeros
  if (buffer.every(byte => byte === 0)) {
    buffer[0] = 1; // Set at least one byte to non-zero
  }
  return Array.from(buffer);
};

describe("creatorclaim_certificate", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CreatorclaimCertificate as Program<CreatorclaimCertificate>;
  const creator = provider.wallet as anchor.Wallet;

  // Use a keypair for the 'asset_id' - in reality, this would likely be the mint address of a cNFT
  const assetId = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Generate test data
    const metadataUriHash = generateRandomHash();
    const licenceTemplateId = 1; // Example: Standard Non-Exclusive Commercial
    const royaltySplits: RoyaltySplitInput[] = [
      { beneficiary: creator.publicKey, shareBps: 10000 }, // 100% to creator
    ];

    // Derive the PDA for CertificateDetails
    const [certificateDetailsPDA, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("certificate_details"),
        assetId.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Call the register_certificate instruction
    const tx = await program.methods
      .registerCertificate(metadataUriHash, licenceTemplateId, royaltySplits)
      .accounts({
        creator: creator.publicKey,
        certificateDetails: certificateDetailsPDA,
        assetIdOrMintPk: assetId.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Register certificate transaction signature", tx);

    // Fetch the created account
    const accountData = await program.account.certificateDetails.fetch(certificateDetailsPDA);

    // Assertions
    assert.ok(accountData.authority.equals(creator.publicKey));
    assert.deepEqual(accountData.metadataUriHash, metadataUriHash);
    assert.equal(accountData.licenceTemplateId, licenceTemplateId);
    assert.equal(accountData.royaltySplits.length, 1);
    assert.ok(accountData.royaltySplits[0].beneficiary.equals(creator.publicKey));
    assert.equal(accountData.royaltySplits[0].shareBps, 10000);
    assert.ok(accountData.bump);

    console.log("Certificate details registered successfully:", accountData);
  });

  // --- Add tests for failure cases below ---

  // Test: Invalid royalty sum (not 10000 bps)
  it("Should fail with invalid royalty sum", async () => {
    const metadataUriHash = generateRandomHash();
    const licenceTemplateId = 1;
    const invalidRoyaltySplits: RoyaltySplitInput[] = [
      { beneficiary: creator.publicKey, shareBps: 5000 }, // Only 50%
      { beneficiary: anchor.web3.Keypair.generate().publicKey, shareBps: 4000 }, // Only 40%
    ];
    const testAssetId = anchor.web3.Keypair.generate();
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("certificate_details"), testAssetId.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerCertificate(metadataUriHash, licenceTemplateId, invalidRoyaltySplits)
        .accounts({
          creator: creator.publicKey,
          certificateDetails: pda,
          assetIdOrMintPk: testAssetId.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Transaction should have failed due to invalid royalty sum.");
    } catch (err) {
      // Check AnchorError code
      // console.log(JSON.stringify(err, null, 2));
      assert.equal(err.error.errorCode.code, "InvalidRoyaltySum");
      assert.equal(err.error.errorCode.number, 6000);
      console.log("Successfully caught InvalidRoyaltySum error.");
    }
  });

  // Test: Too many recipients (> 10)
  it("Should fail with too many recipients", async () => {
    const metadataUriHash = generateRandomHash();
    const licenceTemplateId = 1;
    const tooManySplits: RoyaltySplitInput[] = [];
    for (let i = 0; i < 11; i++) { // Create 11 splits
        tooManySplits.push({
            beneficiary: anchor.web3.Keypair.generate().publicKey,
            shareBps: (i < 10 ? 1000 : 0) // Distribute 10000 bps among first 10
        });
    }
     // Adjust last share to make sum 10000 among first 10 (original logic had potential issues)
     let currentSumFirst10 = 0;
     for (let i = 0; i < 10; i++) {
        currentSumFirst10 += tooManySplits[i].shareBps as number;
     }
     if (tooManySplits.length > 9) {
         tooManySplits[9].shareBps = (tooManySplits[9].shareBps as number) + (10000 - currentSumFirst10);
     }

    // Re-calculate sum for logging/verification
    let totalBpsFirst10 = 0;
    for(let i=0; i<10; i++) { totalBpsFirst10 += tooManySplits[i].shareBps as number; }
    console.log(`Attempting ${tooManySplits.length} splits, first 10 sum to ${totalBpsFirst10} bps`);

    const testAssetId = anchor.web3.Keypair.generate();
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("certificate_details"), testAssetId.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerCertificate(metadataUriHash, licenceTemplateId, tooManySplits)
        .accounts({
          creator: creator.publicKey,
          certificateDetails: pda,
          assetIdOrMintPk: testAssetId.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Transaction should have failed due to too many recipients.");
    } catch (err) {
       assert.equal(err.error.errorCode.code, "TooManyRecipients");
       assert.equal(err.error.errorCode.number, 6001);
       console.log("Successfully caught TooManyRecipients error.");
    }
  });

  // Test: Missing metadata hash (all zeros)
  it("Should fail with missing metadata hash", async () => {
    const zeroHash = Array(32).fill(0);
    const licenceTemplateId = 1;
    const validSplits: RoyaltySplitInput[] = [{ beneficiary: creator.publicKey, shareBps: 10000 }];
    const testAssetId = anchor.web3.Keypair.generate();
    const [pda, _] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("certificate_details"), testAssetId.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerCertificate(zeroHash, licenceTemplateId, validSplits)
        .accounts({
          creator: creator.publicKey,
          certificateDetails: pda,
          assetIdOrMintPk: testAssetId.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Transaction should have failed due to missing metadata hash.");
    } catch (err) {
       assert.equal(err.error.errorCode.code, "MissingMetadataHash");
       assert.equal(err.error.errorCode.number, 6002);
       console.log("Successfully caught MissingMetadataHash error.");
    }
  });

});