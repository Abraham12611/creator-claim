'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import NavigationBar from '../../components/NavigationBar';
import { WebIrys } from '@irys/sdk';
import {
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    LAMPORTS_PER_SOL // For potential fee calculations
} from '@solana/web3.js';
import { Buffer } from 'buffer';
// We won't use Metaplex JS directly for the placeholder instruction,
// but keep imports if needed for other parts.
// import { Metaplex } from "@metaplex-foundation/js";
// import { walletAdapterIdentity } from "@metaplex-foundation/js";
// Import required styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Placeholder Program ID - Replace with actual deployed Program ID
const CERTIFICATE_PROGRAM_ID = new PublicKey('Cert111111111111111111111111111111111111111');

interface AssetMetadata {
  name: string;
  description: string;
  image: string; // This will be the Arweave URI of the uploaded file
  attributes: {
    trait_type: string;
    value: string;
  }[];
  // Add other potential fields based on Metaplex standards if needed
  // symbol?: string;
  // seller_fee_basis_points?: number;
  // external_url?: string;
  // properties?: {
  //   files?: { uri: string; type: string }[];
  //   category?: string;
  //   creators?: { address: string; share: number }[];
  // };
}

interface RoyaltySplitInput {
    address: string;
    percentage: number;
}

export default function MintPage() {
  const { publicKey, signTransaction, wallet, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [licenceTemplate, setLicenceTemplate] = useState<string>('standard'); // Example: Standard
  // Initialize with one split for the creator
  const [royaltySplits, setRoyaltySplits] = useState<RoyaltySplitInput[]>([{ address: '', percentage: 100 }]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // General processing state
  const [statusMessage, setStatusMessage] = useState<string>(''); // User-facing status
  const [irysInstance, setIrysInstance] = useState<WebIrys | null>(null);
  const [isIrysReady, setIsIrysReady] = useState<boolean>(false);

  // Transaction specific state
  const [isSendingTx, setIsSendingTx] = useState<boolean>(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Initialize creator address in first royalty split when wallet connects
  useEffect(() => {
    if (connected && publicKey && royaltySplits.length === 1 && royaltySplits[0].address === '') {
        setRoyaltySplits([{ address: publicKey.toBase58(), percentage: 100 }]);
    }
    // Reset if disconnected
    if (!connected && royaltySplits.length === 1 && royaltySplits[0].percentage === 100) {
         setRoyaltySplits([{ address: '', percentage: 100 }]);
    }
  }, [connected, publicKey, royaltySplits]);

  const initializeIrys = useCallback(async () => {
    if (!wallet || !wallet.adapter.connected || !publicKey || !connection) {
        console.log("InitializeIrys pre-conditions not met:", {
            hasWallet: !!wallet,
            adapterConnected: wallet?.adapter.connected,
            hasPublicKey: !!publicKey,
            hasConnection: !!connection
        });
        return;
    }

    console.log('Attempting to initialize Irys...');
    setIsIrysReady(false);
    setIrysInstance(null);
    setStatusMessage('Initializing Irys...');

    const network = "https://devnet.irys.xyz";
    const providerUrl = connection.rpcEndpoint;
    const token = "solana";

    if (!wallet.adapter) {
        console.error("Wallet adapter is not available.");
        setStatusMessage('Error: Wallet adapter not available.');
        return;
    }

    console.log(`Initializing WebIrys instance...`);

    try {
        const webIrys = new WebIrys({
            url: network,
            token,
            wallet: { name: "solana", provider: wallet.adapter },
            config: {
                providerUrl,
                timeout: 60000
            }
        });

        console.log('Calling webIrys.ready()...');
        await webIrys.ready();
        console.log('Initial webIrys.ready() completed. Address check 1:', webIrys.address);

        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('Checking webIrys.address after delay...');
        if (webIrys.address) {
           console.log('Address confirmed after delay:', webIrys.address);
           setIrysInstance(webIrys);
           setIsIrysReady(true);
           setStatusMessage('Irys ready.');
           console.log('Irys successfully initialized and ready.');
        } else {
           console.error("Irys address still undefined after ready() and delay.");
           console.log("Irys instance state:", webIrys);
           throw new Error("Address is undefined after ready(), please check console logs.");
        }
    } catch (error) {
        console.error("Error during Irys initialization or ready():", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatusMessage(`Error initializing Irys: ${errorMessage}`);
        setIsIrysReady(false);
    }
  }, [wallet, connection, publicKey]);

  useEffect(() => {
      if (wallet?.adapter.connected && publicKey && !isIrysReady) {
          initializeIrys();
      }
      if (!wallet?.adapter.connected && (irysInstance || isIrysReady)) {
          console.log('Wallet disconnected, resetting Irys state.');
          setIrysInstance(null);
          setIsIrysReady(false);
          setStatusMessage('');
      }
  }, [wallet?.adapter.connected, publicKey, isIrysReady, initializeIrys, irysInstance]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

   // --- Royalty Split Handlers ---
   const handleSplitChange = (index: number, field: 'address' | 'percentage', value: string | number) => {
        const updatedSplits = [...royaltySplits];
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (field === 'percentage') {
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                updatedSplits[index][field] = numValue;
            } else if (value === '') {
                 updatedSplits[index][field] = 0; // Treat empty string as 0
            }
        } else {
            updatedSplits[index][field] = String(value);
        }
        setRoyaltySplits(updatedSplits);
    };

    const addSplit = () => {
        setRoyaltySplits([...royaltySplits, { address: '', percentage: 0 }]);
    };

    const removeSplit = (index: number) => {
        if (royaltySplits.length > 1) { // Prevent removing the last split
            const updatedSplits = royaltySplits.filter((_, i) => i !== index);
            setRoyaltySplits(updatedSplits);
        }
    };

    const validateSplits = (): boolean => {
        const totalPercentage = royaltySplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for minor float inaccuracies
            setTxError("Royalty percentages must add up to exactly 100%.");
            return false;
        }
        for (const split of royaltySplits) {
            if (!split.address) {
                setTxError("All royalty split addresses must be filled.");
                return false;
            }
            try {
                new PublicKey(split.address); // Validate address format
            } catch (e) {
                setTxError(`Invalid Solana address format: ${split.address}`);
                return false;
            }
             if (split.percentage === undefined || split.percentage < 0) {
                setTxError("Royalty percentages cannot be negative.");
                return false;
            }
        }
        setTxError(null); // Clear previous validation errors
        return true;
    };
   // --- End Royalty Split Handlers ---

  const uploadFileData = async (fileToUpload: File): Promise<string> => {
    if (!irysInstance || !isIrysReady || !publicKey) throw new Error("Irys not ready or wallet not connected");

    const fileBuffer = await fileToUpload.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    setStatusMessage(`Estimating upload cost for ${fileToUpload.name}...`);
    const price = await irysInstance.getPrice(buffer.length);
    setStatusMessage(`Upload cost: ${irysInstance.utils.fromAtomic(price)} SOL`);

    setStatusMessage("Checking Irys balance...");
    const balance = await irysInstance.getLoadedBalance();

    if (price.isGreaterThan(balance)) {
        setStatusMessage(`Funding Irys node with ${irysInstance.utils.fromAtomic(price)} SOL...`);
        try {
            if (publicKey) {
                const solBalance = await connection.getBalance(publicKey);
                console.log(`Current SOL balance: ${solBalance / 1e9} SOL`);
                if (solBalance === 0) {
                  throw new Error("Your Solana wallet has no SOL. Please fund your wallet with devnet SOL first.");
                }
            } else {
                throw new Error("Wallet public key is null, cannot check balance.");
            }

            let fundTxResponse;
            let retries = 0;
            const maxRetries = 3;

            while (retries < maxRetries) {
                try {
                    fundTxResponse = await irysInstance.fund(price);
                    console.log('Funding transaction response:', fundTxResponse);
                    setStatusMessage("Funding transaction sent. Waiting for confirmation...");
                    break;
                } catch (e) {
                    retries++;
                    console.log(`Funding attempt ${retries} failed:`, e);
                    if (retries >= maxRetries) throw e;
                    const backoffTime = Math.pow(2, retries) * 1000;
                    setStatusMessage(`Funding attempt failed, retrying in ${backoffTime/1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }

            setStatusMessage("Funding transaction sent. Waiting for confirmation (approx 15s)...");
            await new Promise(resolve => setTimeout(resolve, 15000));

            const newBalance = await irysInstance.getLoadedBalance();
            if (newBalance.isLessThan(price)) {
                throw new Error("Funding transaction may not have been confirmed. Please check your wallet and try again.");
            }
            setStatusMessage("Funding confirmed. Proceeding with upload...");
        } catch (fundError) {
             console.error("Irys funding failed:", fundError);
             throw new Error(`Irys funding failed: ${fundError instanceof Error ? fundError.message : String(fundError)}`);
        }
    } else {
        setStatusMessage("Sufficient balance. Starting upload...");
    }

    setStatusMessage(`Uploading ${fileToUpload.name}...`);
    const uploadResponse = await irysInstance.upload(buffer, {
        tags: [
            { name: "Content-Type", value: fileToUpload.type },
            { name: "App-Name", value: "CreatorClaim" },
            { name: "Uploader", value: publicKey.toString() }
        ]
    });
    setStatusMessage(`File uploaded! Transaction ID: ${uploadResponse.id}`);
    return uploadResponse.id;
  };

  const uploadMetadata = async (metadataObject: AssetMetadata): Promise<string> => {
    if (!irysInstance || !isIrysReady || !publicKey) throw new Error("Irys not ready or wallet not connected");

    const metadataString = JSON.stringify(metadataObject);
    const buffer = Buffer.from(metadataString, 'utf8');
    const tags = [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "CreatorClaim" },
        { name: "Version", value: "0.1.0" },
        { name: "Title", value: metadataObject.name },
        { name: "Uploader", value: publicKey.toString() }
    ];

    setStatusMessage("Estimating metadata upload cost...");
    const price = await irysInstance.getPrice(buffer.length);
    setStatusMessage(`Metadata upload cost: ${irysInstance.utils.fromAtomic(price)} SOL`);

    setStatusMessage("Checking Irys balance for metadata...");
    const balance = await irysInstance.getLoadedBalance();
    if (price.isGreaterThan(balance)) {
        setStatusMessage(`Funding Irys for metadata: ${irysInstance.utils.fromAtomic(price)} SOL...`);
         try {
            const fundTxResponse = await irysInstance.fund(price);
            console.log('Metadata Funding transaction response:', fundTxResponse);
            setStatusMessage("Metadata Funding transaction sent. Waiting for confirmation (approx 10s)...");
            await new Promise(resolve => setTimeout(resolve, 10000));
            setStatusMessage("Metadata Funding confirmation delay complete. Uploading metadata...");
        } catch (fundError) {
             console.error("Metadata Irys funding failed:", fundError);
             throw new Error(`Metadata Irys funding failed: ${fundError instanceof Error ? fundError.message : String(fundError)}`);
        }
    } else {
        setStatusMessage("Sufficient balance. Uploading metadata...");
    }

    setStatusMessage("Uploading metadata JSON...");
    const uploadResponse = await irysInstance.upload(buffer, { tags });
    setStatusMessage(`Metadata uploaded! Transaction ID: ${uploadResponse.id}`);
    return uploadResponse.id;
  };

  // Placeholder function to simulate sending the mint transaction
  const handleMintTransaction = async (metadataUri: string, name: string) => {
    if (!publicKey || !signTransaction || !connected) {
      setTxError("Wallet not connected or signTransaction not available.");
      return;
    }
    if (!validateSplits()) return; // Validate splits before proceeding

    setIsSendingTx(true);
    setTxSignature(null);
    setTxError(null);
    setStatusMessage("Preparing mint transaction...");

    try {
        // --- Prepare Royalty Splits for Instruction --- //
        const formattedSplits = royaltySplits.map(split => ({
            recipient: new PublicKey(split.address),
            // Convert percentage to basis points (1% = 100 basis points)
            basis_points: Math.round(split.percentage * 100)
        }));

        // --- Define Accounts (PLACEHOLDERS - Update with actual accounts) --- //
        // These will depend heavily on the actual `register_certificate` instruction
        // and whether it interacts with Bubblegum/Metaplex directly or via CPIs.
        const creator = publicKey;
        // Example PDA derivation (replace with actual seeds/logic)
        const [certificatePda, _certificateBump] = PublicKey.findProgramAddressSync(
            [Buffer.from("certificate"), creator.toBuffer(), Buffer.from(name)], // Example seeds
            CERTIFICATE_PROGRAM_ID
        );
        // Other potential accounts (highly speculative):
        // const treeAuthority = new PublicKey('TreeAuth111...'); // Example Bubblegum tree authority
        // const merkleTree = new PublicKey('MerkleTree111...'); // Example Bubblegum merkle tree
        // const bubblegumProgram = new PublicKey('BGUM111...'); // Bubblegum Program ID
        // const tokenMetadataProgram = new PublicKey('metaqbxx...'); // Token Metadata Program ID

        // --- Construct Instruction Data (PLACEHOLDER - based on potential Rust struct) --- //
        // This needs to match the exact serialization expected by the program.
        // We'll use a simplified placeholder structure.
        // Assume instruction discriminator is handled by Anchor wrapper if using it later.
        const instructionData = Buffer.concat([
            // Placeholder for instruction discriminator (e.g., 8 bytes for Anchor)
            Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08]), // Replace with actual discriminator
            Buffer.from(metadataUri), // metadata_uri (assuming string)
            // Need to handle length prefix if required by serialization (e.g., Borsh)
            Buffer.from(name), // name (assuming string)
            // Placeholder for royalty splits (needs proper serialization, e.g., Borsh Vec<RoyaltySplit>)
            // This Buffer.from is NOT correct serialization, just a placeholder
            Buffer.from(JSON.stringify(formattedSplits)),
            Buffer.from(licenceTemplate), // licence_template_seed (assuming string)
        ]);

        // --- Create Instruction (PLACEHOLDER) --- //
        const registerInstruction = new TransactionInstruction({
            keys: [
                // Define AccountMetas based on the instruction's requirements
                { pubkey: creator, isSigner: true, isWritable: true },
                { pubkey: certificatePda, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                // Add other required accounts here (e.g., treeAuthority, merkleTree, bubblegumProgram...)
            ],
            programId: CERTIFICATE_PROGRAM_ID,
            data: instructionData, // Placeholder data
        });

        // --- Create and Send Transaction --- //
        const transaction = new Transaction().add(registerInstruction);
        setStatusMessage("Requesting transaction signature...");

        const { context: { slot: minContextSlot }, value: { blockhash, lastValidBlockHeight } } = await connection.getLatestBlockhashAndContext();

        // Sign and send using the wallet adapter
        const signature = await sendTransaction(transaction, connection, { minContextSlot }); // Use sendTransaction directly
        setStatusMessage(`Transaction sent: ${signature}. Waiting for confirmation...`);
        setTxSignature(signature);

        await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

        setStatusMessage(`Mint transaction confirmed! Signature: ${signature}`);
        console.log(`Transaction successful with signature: ${signature}`);
        setTxError(null);

        // Maybe reset form or redirect here upon success

    } catch (error: any) {
        console.error("Mint transaction failed:", error);
        const message = error.message || 'Unknown transaction error';
        setStatusMessage(`Mint transaction failed: ${message}`);
        setTxError(message);
    } finally {
        setIsSendingTx(false);
    }
  };

  // Main submission handler
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file || !title || !description || !isIrysReady || !publicKey) {
      setStatusMessage("Please fill all fields, upload a file, and ensure Irys is ready.");
      return;
    }
    if (!validateSplits()) return; // Also validate splits early

    setIsProcessing(true);
    setStatusMessage("Starting mint process...");
    setTxSignature(null);
    setTxError(null);
    setIsSendingTx(false); // Reset tx state

    try {
      // 1. Upload File Data
      setStatusMessage("Uploading file to Arweave via Irys...");
      const fileTxId = await uploadFileData(file);
      const fileUri = `ar://${fileTxId}`;
      setStatusMessage(`File uploaded: ${fileUri}`);

      // 2. Prepare Metadata
      const metadata: AssetMetadata = {
        name: title,
        description: description,
        image: fileUri, // Use Arweave URI for the image field
        attributes: [
          { trait_type: "Licence Template", value: licenceTemplate },
          // Add other relevant attributes
        ],
        // Add other Metaplex standard fields if desired
      };

      // 3. Upload Metadata JSON
      setStatusMessage("Uploading metadata JSON to Arweave via Irys...");
      const metadataTxId = await uploadMetadata(metadata);
      const metadataUri = `ar://${metadataTxId}`;
      setStatusMessage(`Metadata uploaded: ${metadataUri}. Preparing Solana transaction...`);
      console.log("Successfully uploaded metadata:", metadataUri);

      // 4. **Call the placeholder mint transaction function**
      await handleMintTransaction(metadataUri, title);
      // The status will be updated within handleMintTransaction

      // Optionally save to local storage or clear form on final success
      // saveToLocalStorage({ title, metadataUri, txSignature });

    } catch (error: any) {
      console.error("Minting process failed:", error);
      setStatusMessage(`Error during minting: ${error.message || 'Unknown error'}`);
      // Set TxError as well if the error is transaction-related
      if (isSendingTx) {
          setTxError(error.message || 'Unknown transaction error');
      }
    } finally {
      setIsProcessing(false);
      // Keep isSendingTx as is, it's managed within handleMintTransaction
    }
  };

  // --- UI Rendering --- //
  const totalPercentage = royaltySplits.reduce((sum, split) => sum + (split.percentage || 0), 0);
  const explorerUrl = txSignature ? `https://explorer.solana.com/tx/${txSignature}?cluster=devnet` : '#';

  return (
    <div className="flex flex-col min-h-screen font-sans bg-black text-pure-white">
        <NavigationBar />
        <main className="flex-grow container mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold mb-8 text-center text-electric-cyan">Mint New Certificate</h1>

            {!connected ? (
                <div className="text-center p-6 bg-midnight-navy/50 rounded-lg border border-neon-lilac/20">
                    <p className="text-lg mb-4">Please connect your wallet to mint a certificate.</p>
                    <WalletMultiButton />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 bg-midnight-navy/50 p-8 rounded-lg border border-white/10">
                    {/* File Input */}
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-1">
                            Upload Asset File
                        </label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={handleFileChange}
                            required
                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-electric-cyan file:text-midnight-navy hover:file:bg-opacity-80 cursor-pointer border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent"
                        />
                        {file && <p className="text-xs text-gray-400 mt-1">Selected: {file.name}</p>}
                    </div>

                    {/* Title Input */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-pure-white focus:outline-none focus:ring-1 focus:ring-electric-cyan focus:border-electric-cyan"
                        />
                    </div>

                    {/* Description Input */}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-pure-white focus:outline-none focus:ring-1 focus:ring-electric-cyan focus:border-electric-cyan"
                        />
                    </div>

                    {/* Licence Template Select */}
                    <div>
                        <label htmlFor="licence-template" className="block text-sm font-medium text-gray-300 mb-1">Licence Template</label>
                        <select
                            id="licence-template"
                            value={licenceTemplate}
                            onChange={(e) => setLicenceTemplate(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-pure-white focus:outline-none focus:ring-1 focus:ring-electric-cyan focus:border-electric-cyan"
                        >
                            {/* Update options based on actual templates defined */}
                            <option value="standard">Standard Non-Exclusive</option>
                            <option value="editorial">Editorial Use</option>
                            <option value="exclusive">Exclusive Buy-Out</option>
                        </select>
                    </div>

                     {/* Royalty Splits */}
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Royalty Splits (%)</label>
                        {royaltySplits.map((split, index) => (
                            <div key={index} className="flex items-center space-x-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Recipient Address (e.g., Solana Wallet)"
                                    value={split.address}
                                    onChange={(e) => handleSplitChange(index, 'address', e.target.value)}
                                    required
                                    className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-pure-white focus:outline-none focus:ring-1 focus:ring-electric-cyan focus:border-electric-cyan text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="%"
                                    value={split.percentage}
                                    onChange={(e) => handleSplitChange(index, 'percentage', e.target.value)}
                                    required
                                    min="0"
                                    max="100"
                                    step="0.01" // Allow fractional percentages
                                    className="w-20 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-pure-white focus:outline-none focus:ring-1 focus:ring-electric-cyan focus:border-electric-cyan text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeSplit(index)}
                                    disabled={royaltySplits.length <= 1}
                                    className={`px-2 py-1 rounded text-sm ${royaltySplits.length > 1 ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                         <button
                            type="button"
                            onClick={addSplit}
                            className="text-sm text-electric-cyan hover:underline mt-1"
                        >
                            + Add Royalty Recipient
                        </button>
                        <p className={`text-sm mt-1 ${totalPercentage === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                            Total Percentage: {totalPercentage.toFixed(2)}%
                        </p>
                    </div>

                    {/* Submit Button & Status */}
                    <div>
                        <button
                            type="submit"
                            disabled={isProcessing || !isIrysReady || !connected}
                            className={`w-full py-2 px-4 rounded transition-all duration-300 font-semibold ${(!isIrysReady || !connected)
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-electric-cyan text-midnight-navy hover:bg-opacity-80 hover:shadow-neon-cyan/50 disabled:opacity-50'
                            }`}
                        >
                             {isProcessing ? 'Processing...' : (!connected ? 'Connect Wallet' : (!isIrysReady ? 'Initializing Irys...' : 'Upload & Mint Certificate'))}
                        </button>

                        {statusMessage && (
                            <p className="text-sm text-gray-400 mt-3 text-center">Status: {statusMessage}</p>
                        )}

                        {txError && (
                            <p className="text-sm text-red-500 mt-2 text-center">Transaction Error: {txError}</p>
                        )}

                        {txSignature && (
                            <div className="mt-3 text-center">
                                <p className="text-sm text-green-400">Mint Transaction Sent!</p>
                                <a
                                    href={explorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-neon-lilac hover:underline block"
                                >
                                    View on Explorer: {txSignature.substring(0, 8)}...
                                </a>
                             </div>
                        )}
                    </div>
                </form>
            )}
        </main>
    </div>
  );
}

// Removed unused functions like verifyMetadataAccess, mintNftOnSolana, saveToLocalStorage for clarity
// They can be added back if needed.
