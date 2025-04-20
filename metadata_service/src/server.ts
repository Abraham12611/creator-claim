// Simple Express server for handling metadata uploads
// Requires: npm install express multer @types/express @types/multer

const express = require('express');
const multer = require('multer');
const { uploadFile } = require('./uploader');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001; // Port for the metadata service

// Configure multer for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // Example: 100MB limit (adjust as needed)
});

// Middleware for JSON body parsing (optional, if you add other routes)
app.use(express.json());

// --- Routes ---

// Health check route
app.get('/health', (req: any, res: any) => {
    res.status(200).send('OK');
});

// File upload route
// Expects a single file upload with the field name 'assetFile'
app.post('/upload', upload.single('assetFile'), async (req: any, res: any) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded.' });
    }

    try {
        const fileBuffer = req.file.buffer;
        const contentType = req.file.mimetype;

        console.log(`[Server] Received upload request for file: ${req.file.originalname} (${contentType})`);

        // 1. Upload to permanent storage (Arweave/IPFS)
        const storageIdentifier = await uploadFile(fileBuffer, contentType);

        // 2. Generate metadata URI (adjust format as needed)
        // Example for Arweave: ar://<TX_ID>
        // Example for IPFS: ipfs://<CID>
        const metadataUri = `ar://${storageIdentifier}`; // Example for Arweave
        // const metadataUri = `ipfs://${storageIdentifier}`; // Example for IPFS

        // 3. Calculate SHA-256 hash of the metadata URI string
        const hash = crypto.createHash('sha256');
        hash.update(metadataUri);
        const metadataUriHash = hash.digest('hex'); // Use hex for easier representation? Or buffer?
         // Convert hex hash to byte array ([u8; 32]) expected by the program
         // Note: Ensure the program expects the hash of the *URI string*, not the file content.
         const metadataUriHashBytes = Buffer.from(metadataUriHash, 'hex');
         if (metadataUriHashBytes.length !== 32) {
             throw new Error('Generated hash is not 32 bytes long!');
         }


        console.log(`[Server] File uploaded. Identifier: ${storageIdentifier}, URI: ${metadataUri}, URI Hash: ${metadataUriHash}`);

        // 4. Return the identifier, URI, and hash to the client
        res.status(200).send({
            storageIdentifier, // e.g., Arweave TX ID or IPFS CID
            metadataUri,       // e.g., ar://... or ipfs://...
            metadataUriHash: Array.from(metadataUriHashBytes), // Return as array of numbers ([u8; 32])
        });

    } catch (error: any) {
        console.error("[Server] Error processing upload:", error);
        res.status(500).send({ error: error.message || 'Failed to process file upload.' });
    }
});

// --- Start Server ---

app.listen(port, () => {
    console.log(`Metadata service listening on port ${port}`);
});