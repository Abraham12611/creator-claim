import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CreatorclaimCertificate } from "../target/types/creatorclaim_certificate";
import { assert } from "chai";

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
    const royaltySplits = [
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
    const invalidRoyaltySplits = [
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
    const tooManySplits = [];
    for (let i = 0; i < 11; i++) { // Create 11 splits
        tooManySplits.push({
            beneficiary: anchor.web3.Keypair.generate().publicKey,
            shareBps: (i < 10 ? 1000 : 0) // Distribute 10000 bps among first 10
        });
    }
     // Adjust last two to make sum 10000 among first 10
     if(tooManySplits.length > 10) {
         tooManySplits[9].shareBps = 1000;
     }
     // Correct sum for first 10
     let current_sum = 0;
     for (let i = 0; i < 10; i++) {
         current_sum += tooManySplits[i].shareBps;
     }
     if (current_sum !== 10000 && tooManySplits.length > 9) {
         tooManySplits[9].shareBps += (10000 - current_sum);
     }

    // Re-calculate sum for logging/verification
    let totalBps = 0;
    for(let i=0; i<10; i++) { totalBps += tooManySplits[i].shareBps; }
    console.log(`Attempting ${tooManySplits.length} splits, first 10 sum to ${totalBps} bps`);

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
    const validSplits = [{ beneficiary: creator.publicKey, shareBps: 10000 }];
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