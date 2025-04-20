// Simple Express server for handling metadata uploads
// Requires: npm install express multer @types/express @types/multer

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { uploadFile } from './uploader';
import { createHash } from 'node:crypto'; // Use node:crypto for explicit Node.js module
import { Buffer } from 'node:buffer';

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
app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
});

// File upload route
// Expects a single file upload with the field name 'assetFile'
app.post('/upload', upload.single('assetFile'), async (req: Request, res: Response, next: NextFunction) => {
    // Check if req.file exists (Multer adds file info to req)
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

        // 3. Calculate SHA-256 hash of the metadata URI string using node:crypto
        const hash = createHash('sha256');
        hash.update(metadataUri);
        const metadataUriHashHex = hash.digest('hex');
        const metadataUriHashBytes = Buffer.from(metadataUriHashHex, 'hex');

        if (metadataUriHashBytes.length !== 32) {
            throw new Error('Generated hash is not 32 bytes long!');
        }

        console.log(`[Server] File uploaded. Identifier: ${storageIdentifier}, URI: ${metadataUri}, URI Hash: ${metadataUriHashHex}`);

        // 4. Return the identifier, URI, and hash to the client
        res.status(200).send({
            storageIdentifier, // e.g., Arweave TX ID or IPFS CID
            metadataUri,       // e.g., ar://... or ipfs://...
            metadataUriHash: Array.from(metadataUriHashBytes), // Return as array of numbers ([u8; 32])
        });

    } catch (error: any) {
        console.error("[Server] Error processing upload:", error);
        // Pass error to a generic error handler (best practice)
        next(error);
    }
});

// --- Generic Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("[Server] Unhandled Error:", err.stack || err);
    res.status(err.status || 500).send({
        error: err.message || 'Internal Server Error'
    });
});

// --- Start Server ---

app.listen(port, () => {
    console.log(`Metadata service listening on port ${port}`);
});