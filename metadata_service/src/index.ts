import express from 'express';
import { uploadFile } from './uploader';
import * as dotenv from 'dotenv';
import { Buffer } from 'node:buffer';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable JSON body parsing
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'metadata-service' });
});

// Upload endpoint
app.post('/upload', async (req, res) => {
  try {
    // Validate request body
    if (!req.body.data || !req.body.contentType) {
      return res.status(400).json({ error: 'Missing required fields: data and contentType' });
    }

    const { data, contentType } = req.body;

    // Convert base64 data to buffer
    const buffer = Buffer.from(data, 'base64');

    // Upload to Arweave via Irys
    const txId = await uploadFile(buffer, contentType);

    // Return the Arweave transaction ID and URI
    res.status(200).json({
      success: true,
      txId,
      uri: `https://arweave.net/${txId}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Metadata upload endpoint
app.post('/metadata', async (req, res) => {
  try {
    // Validate request body
    if (!req.body.metadata) {
      return res.status(400).json({ error: 'Missing required field: metadata' });
    }

    const { metadata } = req.body;

    // Convert metadata to JSON string and then to buffer
    const metadataString = JSON.stringify(metadata);
    const buffer = Buffer.from(metadataString, 'utf8');

    // Upload to Arweave via Irys
    const txId = await uploadFile(buffer, 'application/json');

    // Return the Arweave transaction ID and URI
    res.status(200).json({
      success: true,
      txId,
      uri: `https://arweave.net/${txId}`
    });
  } catch (error) {
    console.error('Metadata upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Metadata service running on port ${PORT}`);
});