import { Buffer } from 'node:buffer'; // Explicit import for Buffer
import fs from 'node:fs'; // Needed to read wallet file
import Bundlr from '@bundlr-network/client';

// Placeholder for uploader logic (Arweave/IPFS/S3)

// --- Arweave/Bundlr Configuration (Example) ---
// import Bundlr from "@bundlr-network/client";
// const bundlr = new Bundlr("http://node1.bundlr.network", "solana", process.env.PAYER_WALLET_JSON);

// --- IPFS Configuration (Example) ---
// import { create } from 'ipfs-http-client';
// const ipfs = create({ url: process.env.IPFS_API_URL || '/ip4/127.0.0.1/tcp/5001' });

// --- S3 Configuration (Example) ---
// import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// const s3 = new S3Client({
//     endpoint: process.env.S3_ENDPOINT,
//     region: process.env.S3_REGION,
//     credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY }
// });

// --- Arweave/Bundlr Configuration ---
let bundlrInstance: Bundlr | null = null;

function getBundlr() {
    if (!bundlrInstance) {
        const networkUrl = process.env.BUNDLR_NETWORK_URL || "http://devnet.bundlr.network"; // Default to devnet
        const currency = process.env.BUNDLR_CURRENCY || "solana";
        const walletPath = process.env.PAYER_WALLET_JSON;

        if (!walletPath) {
            throw new Error("PAYER_WALLET_JSON environment variable is required for Bundlr.");
        }
        if (!fs.existsSync(walletPath)) {
             throw new Error(`Payer wallet file not found at: ${walletPath}`);
        }

        const privateKey = fs.readFileSync(walletPath, 'utf-8');

        console.log(`Initializing Bundlr: Network=${networkUrl}, Currency=${currency}`);
        try {
             // Note: For Solana, the privateKey is the JSON keypair file content as a string
            bundlrInstance = new Bundlr(networkUrl, currency, privateKey);
            console.log(`Bundlr initialized. Address: ${bundlrInstance.address}`);
        } catch (error: any) {
             console.error("Failed to initialize Bundlr:", error);
             throw new Error(`Failed to initialize Bundlr: ${error.message}`);
        }

    }
    return bundlrInstance;
}

/**
 * Uploads file buffer to permanent storage (Arweave via Bundlr).
 *
 * @param fileBuffer The file data buffer.
 * @param contentType The MIME type of the file.
 * @returns The Arweave Transaction ID.
 */
export async function uploadFile(fileBuffer: Buffer, contentType: string): Promise<string> {
    console.log(`[Uploader] Attempting Arweave upload via Bundlr (${contentType}, ${fileBuffer.length} bytes)...`);
    const bundlr = getBundlr();

    try {
        // Prepare tags
        const tags = [{ name: "Content-Type", value: contentType }];

        // Optional: Fund Bundlr node if needed (can be slow, often done separately)
        // const price = await bundlr.getPrice(fileBuffer.length);
        // const balance = await bundlr.getLoadedBalance();
        // if (balance.isLessThan(price)) {
        //     console.log(`Funding Bundlr node: ${price.minus(balance).toString()} lamports`);
        //     await bundlr.fund(price.minus(balance));
        // }

        // Perform the upload
        const tx = await bundlr.upload(fileBuffer, { tags });
        const arweaveTxId = tx.id;

        if (!arweaveTxId) {
             throw new Error("Bundlr upload transaction did not return an ID.");
        }

        console.log(`[Uploader] File uploaded to Arweave via Bundlr. Tx ID: ${arweaveTxId}`);
        // Optional: Cache to S3 if implemented
        // await cacheToS3(arweaveTxId, fileBuffer, contentType);
        return arweaveTxId;

    } catch (error: any) {
        console.error("[Uploader] Error uploading to Arweave via Bundlr:", error);
        // Attempt to provide more specific feedback if possible
        let message = "Failed to upload file to Arweave.";
        if (error.message && error.message.includes("Not enough funds")) {
             message = "Bundlr account needs funding. Please fund address: " + bundlr.address;
        }
        throw new Error(message);
    }
}

/**
 * (Optional) Caches the file to S3.
 *
 * @param identifier The Arweave TX ID or IPFS CID.
 * @param fileBuffer The file data buffer.
 * @param contentType The MIME type of the file.
 */
async function cacheToS3(identifier: string, fileBuffer: Buffer, contentType: string): Promise<void> {
    // const bucketName = process.env.S3_BUCKET_NAME;
    // if (!bucketName) {
    //     console.warn("[Uploader] S3 bucket name not configured, skipping cache.");
    //     return;
    // }
    // console.log(`[Uploader] Caching ${identifier} to S3 bucket ${bucketName}...`);
    // try {
    //     const command = new PutObjectCommand({
    //         Bucket: bucketName,
    //         Key: identifier, // Use the permanent ID as the S3 key
    //         Body: fileBuffer,
    //         ContentType: contentType,
    //         // Optional: Add Cache-Control headers, ACL, etc.
    //         // CacheControl: "public, max-age=31536000, immutable",
    //     });
    //     await s3.send(command);
    //     console.log(`[Uploader] File cached to S3: ${identifier}`);
    // } catch (error) {
    //     console.error(`[Uploader] Error caching ${identifier} to S3:`, error);
    //     // Don't throw error, caching is optional
    // }
}