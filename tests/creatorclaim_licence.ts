import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { CreatorclaimLicence } from "../target/types/creatorclaim_licence";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createMint,
    createAccount,
    mintTo,
    getAccount
} from "@solana/spl-token"; // Using @solana/spl-token for setup
import { assert } from "chai";
import "mocha";

// Helper function to delay execution
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

describe("creatorclaim_licence", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const connection = provider.connection;

  const program = anchor.workspace.CreatorclaimLicence as Program<CreatorclaimLicence>;
  const buyer = provider.wallet as anchor.Wallet;
  const treasury = anchor.web3.Keypair.generate(); // Platform treasury wallet

  // Mocks/Placeholders
  const certificateDetailsKP = anchor.web3.Keypair.generate(); // Mock CertificateDetails account pubkey
  const certificateDetailsPubkey = certificateDetailsKP.publicKey;

  let paymentMint: web3.PublicKey = null;
  let buyerTokenAccount: web3.PublicKey = null;
  let treasuryTokenAccount: web3.PublicKey = null;
  let licencePDA: web3.PublicKey = null;
  let licenceBump: number = 0;

  const purchasePrice = new BN(100 * 10**6); // Example: 100 USDC (assuming 6 decimals)

  // Setup before tests
  before(async () => {
    // 1. Airdrop SOL to treasury (to create token account)
    await connection.requestAirdrop(treasury.publicKey, 1 * web3.LAMPORTS_PER_SOL);
    await delay(500); // Delay to allow airdrop confirmation

    // 2. Create Payment Mint (mock USDC)
    paymentMint = await createMint(
        connection,
        buyer.payer, // Payer for mint creation
        buyer.publicKey, // Mint authority
        null, // Freeze authority (optional)
        6 // Decimals (common for USDC)
    );
    console.log(`Payment Mint created: ${paymentMint.toBase58()}`);

    // 3. Create Buyer Token Account
    buyerTokenAccount = await createAccount(
        connection,
        buyer.payer, // Payer for account creation
        paymentMint,
        buyer.publicKey // Owner of the account
    );
    console.log(`Buyer Token Account: ${buyerTokenAccount.toBase58()}`);

    // 4. Create Treasury Token Account
    treasuryTokenAccount = await createAccount(
        connection,
        treasury, // Treasury pays for its own account
        paymentMint,
        treasury.publicKey // Owner of the account
    );
    console.log(`Treasury Token Account: ${treasuryTokenAccount.toBase58()}`);

    // 5. Mint tokens to Buyer
    const mintAmount = purchasePrice.mul(new BN(2)); // Mint 2x the price
    await mintTo(
        connection,
        buyer.payer, // Payer
        paymentMint,
        buyerTokenAccount,
        buyer.publicKey, // Mint authority
        mintAmount.toNumber() // Amount needs to be a number for spl-token function
    );
    console.log(`Minted ${mintAmount} tokens to buyer account.`);

    const buyerAccountInfo = await getAccount(connection, buyerTokenAccount);
    assert.equal(buyerAccountInfo.amount.toString(), mintAmount.toString(), "Buyer account balance mismatch after mint");

    // 6. Derive Licence PDA (needed for revoke test later)
    const [pda, bump] = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from("licence"),
            certificateDetailsPubkey.toBuffer(),
            buyer.publicKey.toBuffer(),
        ],
        program.programId
    );
    licencePDA = pda;
    licenceBump = bump;
  });

  it("Purchases a licence successfully!", async () => {
    const expiryTimestamp = null; // Perpetual licence

    const buyerBalanceBefore = (await getAccount(connection, buyerTokenAccount)).amount;
    const treasuryBalanceBefore = (await getAccount(connection, treasuryTokenAccount)).amount;

    // Call the purchase_licence instruction
    const tx = await program.methods
      .purchaseLicence(purchasePrice, expiryTimestamp)
      .accounts({
        buyer: buyer.publicKey,
        buyerTokenAccount: buyerTokenAccount,
        licence: licencePDA,
        certificateDetails: certificateDetailsPubkey,
        treasuryTokenAccount: treasuryTokenAccount,
        paymentMint: paymentMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Purchase licence transaction signature", tx);
    await delay(500); // Allow time for state changes

    // Fetch the created Licence PDA
    const licenceAccountData = await program.account.licence.fetch(licencePDA);

    // Assertions on Licence PDA
    assert.ok(licenceAccountData.certificateDetails.equals(certificateDetailsPubkey));
    assert.ok(licenceAccountData.buyer.equals(buyer.publicKey));
    assert.ok(licenceAccountData.purchasePrice.eq(purchasePrice));
    assert.ok(licenceAccountData.purchaseTimestamp.toNumber() > 0);
    assert.isNull(licenceAccountData.expiryTimestamp);
    assert.equal(JSON.stringify(licenceAccountData.status), JSON.stringify({ active: {} })); // Check enum serialization
    assert.equal(licenceAccountData.bump, licenceBump);

    // Assertions on Token Balances
    const buyerBalanceAfter = (await getAccount(connection, buyerTokenAccount)).amount;
    const treasuryBalanceAfter = (await getAccount(connection, treasuryTokenAccount)).amount;

    const expectedBuyerBalance = new BN(buyerBalanceBefore.toString()).sub(purchasePrice);
    const expectedTreasuryBalance = new BN(treasuryBalanceBefore.toString()).add(purchasePrice);

    assert.equal(buyerBalanceAfter.toString(), expectedBuyerBalance.toString(), "Buyer balance incorrect after purchase");
    assert.equal(treasuryBalanceAfter.toString(), expectedTreasuryBalance.toString(), "Treasury balance incorrect after purchase");

    console.log("Licence purchased successfully. PDA:", licenceAccountData);
  });

  it("Revokes a licence successfully!", async () => {
    // Ensure licence was created in the previous test
    const licenceAccountDataBefore = await program.account.licence.fetch(licencePDA);
    assert.equal(JSON.stringify(licenceAccountDataBefore.status), JSON.stringify({ active: {} }), "Licence not active before revoke");

    // Call the revoke_licence instruction
    // Using buyer as revoker because auth check is placeholder
    const tx = await program.methods
      .revokeLicence()
      .accounts({
        revoker: buyer.publicKey,
        licence: licencePDA,
        certificateDetails: certificateDetailsPubkey,
      })
      .signers([buyer.payer]) // Signer is the wallet provider
      .rpc();

    console.log("Revoke licence transaction signature", tx);
    await delay(500); // Allow time for state changes

    // Fetch the updated Licence PDA
    const licenceAccountDataAfter = await program.account.licence.fetch(licencePDA);

    // Assertions on Licence PDA status
    assert.equal(JSON.stringify(licenceAccountDataAfter.status), JSON.stringify({ revoked: {} }), "Licence status not Revoked after revoke");

    console.log("Licence revoked successfully. New status:", licenceAccountDataAfter.status);
  });

  // --- TODO: Add failure case tests ---
  // - purchase_licence: insufficient funds
  // - revoke_licence: invalid status (already revoked/expired)
  // - revoke_licence: wrong certificate_details account (constraint check)
  // - revoke_licence: unauthorized revoker (once auth logic is added)

});