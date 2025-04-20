// Main indexer script

const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { initializeParsers, parseCertificateEvent, parseLicenceEvent } = require("./parser");
const { insertCertificateRegistration, insertLicencePurchase, updateLicenceStatus } = require("./db");

// --- Configuration ---
// TODO: Replace with your actual deployed program IDs
const CERTIFICATE_PROGRAM_ID = new PublicKey("CERTxxxxxxxxxxxxxxxxxx");
const LICENCE_PROGRAM_ID = new PublicKey("LICxxxxxxxxxxxxxxxxxx");
// TODO: Load IDLs correctly (adjust paths as needed)
const CERTIFICATE_IDL = require("../../target/idl/creatorclaim_certificate.json");
const LICENCE_IDL = require("../../target/idl/creatorclaim_licence.json");

const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
const connection = new Connection(RPC_URL, "confirmed");

// --- Main Logic ---

async function main() {
    console.log("Starting CreatorClaim Indexer...");
    console.log(`Connecting to Solana RPC: ${RPC_URL}`);
    console.log(`Watching Certificate Program: ${CERTIFICATE_PROGRAM_ID.toBase58()}`);
    console.log(`Watching Licence Program: ${LICENCE_PROGRAM_ID.toBase58()}`);

    // Initialize event parsers with IDLs
    initializeParsers(CERTIFICATE_IDL, LICENCE_IDL);

    // Subscribe to logs for both programs
    connection.onLogs(
        CERTIFICATE_PROGRAM_ID,
        (logsResult, context) => {
            if (logsResult.err) {
                console.error("Error fetching certificate logs:", logsResult.err);
                return;
            }
            console.log(`--- Certificate Logs (Slot ${context.slot}, Tx: ${logsResult.signature}) ---`);
            logsResult.logs.forEach(log => {
                const event = parseCertificateEvent(log);
                if (event) {
                    console.log("Parsed Certificate Event:", event.name, event.data);
                    // Handle known events
                    if (event.name === "NewCertificateRegistered") {
                        insertCertificateRegistration(event.data, logsResult.signature).catch(console.error);
                    }
                    // Add handlers for other certificate events if created later
                }
            });
             console.log(`--- End Certificate Logs (Tx: ${logsResult.signature}) ---`);
        },
        "confirmed"
    );

    connection.onLogs(
        LICENCE_PROGRAM_ID,
        (logsResult, context) => {
            if (logsResult.err) {
                console.error("Error fetching licence logs:", logsResult.err);
                return;
            }
            console.log(`--- Licence Logs (Slot ${context.slot}, Tx: ${logsResult.signature}) ---`);
            logsResult.logs.forEach(log => {
                const event = parseLicenceEvent(log);
                if (event) {
                    console.log("Parsed Licence Event:", event.name, event.data);
                    // Handle known events
                    if (event.name === "LicencePurchased") {
                        insertLicencePurchase(event.data, logsResult.signature).catch(console.error);
                    }
                    else if (event.name === "LicenceRevoked") {
                        // Ensure data has expected fields (adjust if event structure changes)
                        if (event.data && event.data.licencePda) {
                             updateLicenceStatus(event.data.licencePda.toBase58(), 'Revoked', logsResult.signature).catch(console.error);
                        } else {
                            console.warn("Could not process LicenceRevoked event: Missing data", event.data);
                        }

                    }
                    // Add handlers for other licence events if created later
                }
            });
             console.log(`--- End Licence Logs (Tx: ${logsResult.signature}) ---`);
        },
        "confirmed"
    );

    console.log("Indexer subscribed to logs. Waiting for events...");

    // Keep the process running (or use a more robust method like a PM2/Docker setup)
    // This simple version will exit if the main thread finishes,
    // but onLogs should keep it alive as long as the connection is open.
    // For robustness, consider using websockets directly or a dedicated service.
    await new Promise(() => {}); // Keep running indefinitely

}

main().catch(err => {
    console.error("Indexer encountered fatal error:", err);
    process.exit(1);
});