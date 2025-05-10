# CreatorClaim Metadata Service

This service handles permanent storage of files and metadata for the CreatorClaim platform, using Arweave (via Irys SDK) for decentralized storage.

## Features

- File upload endpoint for storing assets
- Metadata upload endpoint for storing NFT metadata
- Arweave permanent storage using Irys (previously Bundlr Network)
- Optional S3 caching layer (configurable)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   cd metadata_service
   npm install
   ```
3. Create a `.env` file based on the example below:
   ```
   # Server Configuration
   PORT=3001

   # Arweave/Irys Configuration
   IRYS_NETWORK_URL=https://devnet.irys.xyz
   IRYS_CURRENCY=solana
   PAYER_WALLET_JSON=/path/to/keypair.json

   # Optional S3 Caching Config (for future implementation)
   # S3_BUCKET_NAME=creatorclaim-metadata
   # S3_ENDPOINT=https://civo-object-storage
   # S3_REGION=LON1
   # S3_ACCESS_KEY=your-access-key
   # S3_SECRET_KEY=your-secret-key
   ```
4. Generate a Solana wallet keypair file if you don't have one:
   ```
   solana-keygen new --outfile keypair.json
   ```
5. Fund the wallet with SOL (devnet):
   ```
   solana airdrop 2 -k keypair.json --url devnet
   ```

## Running the Service

```
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Upload File
```
POST /upload
Content-Type: application/json

{
  "data": "base64EncodedData",
  "contentType": "image/png"
}
```

### Upload Metadata
```
POST /metadata
Content-Type: application/json

{
  "metadata": {
    "name": "Asset Name",
    "description": "Asset Description",
    "image": "https://arweave.net/IMAGE_TX_ID",
    "attributes": [
      {
        "trait_type": "Licence Template",
        "value": "0x01"
      }
    ]
  }
}
```

## Response Format

```json
{
  "success": true,
  "txId": "arweave-transaction-id",
  "uri": "https://arweave.net/arweave-transaction-id"
}
```