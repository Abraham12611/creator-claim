// Uses node-postgres (pg library) for database interactions
// Requires `npm install pg` and `@types/pg`
// Requires DATABASE_URL environment variable (e.g., postgresql://user:password@host:port/database)

const { Pool } = require('pg');

// Singleton pattern for connection pool
let pool: any = null;

function getDbPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            throw new Error("DATABASE_URL environment variable is not set.");
        }
        console.log("Creating database connection pool...");
        pool = new Pool({
            connectionString,
            // Optional pool configuration (e.g., max connections, idle timeout)
            // max: 20,
            // idleTimeoutMillis: 30000,
            // connectionTimeoutMillis: 2000,
        });

        pool.on('error', (err: Error, client: any) => {
            console.error('Unexpected error on idle database client', err);
            // Optional: attempt to reconnect or handle error appropriately
        });
    }
    return pool;
}

// --- Schema Definitions & Functions ---
// These assume the corresponding tables have been created in your Postgres database.

// Table: certificates
// Columns: asset_id (VARCHAR PK), creator (VARCHAR), licence_template_id (INTEGER), price (BIGINT), registration_timestamp (TIMESTAMPTZ), tx_signature (VARCHAR)
async function insertCertificateRegistration(eventData: any, txSignature: string) {
    const pool = getDbPool();
    const query = `
        INSERT INTO certificates (asset_id, creator, licence_template_id, price, registration_timestamp, tx_signature)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        ON CONFLICT (asset_id) DO NOTHING; // Ignore if already exists (idempotency)
    `;
    // Ensure data types match event structure from IDL
    const values = [
        eventData.assetId.toBase58(),
        eventData.creator.toBase58(),
        eventData.licenceTemplateId,
        eventData.price.toString(), // Store u64 as string/numeric in DB
        txSignature
    ];
    try {
        await pool.query(query, values);
        console.log(`[DB] Certificate Registration Inserted/Ignored: Asset ${values[0]}`);
    } catch (err) {
        console.error("[DB] Error inserting certificate registration:", err);
        // Optional: Add retry logic or specific error handling
    }
}

// Table: licences
// Columns: licence_pda (VARCHAR PK), certificate_asset_id (VARCHAR FK), buyer (VARCHAR), purchase_price (BIGINT), purchase_timestamp (TIMESTAMPTZ), expiry_timestamp (TIMESTAMPTZ NULL), status (VARCHAR), last_update_timestamp (TIMESTAMPTZ), tx_signature (VARCHAR)
async function insertLicencePurchase(eventData: any, txSignature: string) {
    const pool = getDbPool();
    const query = `
        INSERT INTO licences (licence_pda, certificate_asset_id, buyer, purchase_price, purchase_timestamp, status, last_update_timestamp, tx_signature)
        VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5), 'Active', NOW(), $6)
        ON CONFLICT (licence_pda) DO NOTHING; // Ignore if already exists
    `;
    // Note: purchase_timestamp from Anchor event is i64 (seconds)
    const values = [
        eventData.licencePda.toBase58(),
        eventData.certificateDetails.toBase58(),
        eventData.buyer.toBase58(),
        eventData.purchasePrice.toString(),
        eventData.purchaseTimestamp.toNumber(), // Convert BN/i64 to number for TO_TIMESTAMP
        txSignature
    ];
     try {
        await pool.query(query, values);
        console.log(`[DB] Licence Purchase Inserted/Ignored: PDA ${values[0]}`);
    } catch (err) {
        console.error("[DB] Error inserting licence purchase:", err);
    }
}

async function updateLicenceStatus(licencePda: string, newStatus: 'Revoked' | 'Expired', txSignature: string) {
    const pool = getDbPool();
    const query = `
        UPDATE licences
        SET status = $1, last_update_timestamp = NOW(), tx_signature = $2
        WHERE licence_pda = $3;
    `;
    const values = [newStatus, txSignature, licencePda];
     try {
        const res = await pool.query(query, values);
        if (res.rowCount > 0) {
            console.log(`[DB] Licence Status Updated: PDA ${licencePda}, Status: ${newStatus}`);
        } else {
            console.warn(`[DB] Attempted to update status for non-existent licence PDA: ${licencePda}`);
        }
    } catch (err) {
        console.error("[DB] Error updating licence status:", err);
    }
}

// Table: royalty_splits (if needed separately, or store as JSON in certificates)
// Columns:
// - certificate_asset_id (VARCHAR, FOREIGN KEY references certificates.asset_id)
// - beneficiary (VARCHAR)
// - share_bps (INTEGER)
// PRIMARY KEY (certificate_asset_id, beneficiary)

module.exports = {
    insertCertificateRegistration,
    insertLicencePurchase,
    updateLicenceStatus,
};