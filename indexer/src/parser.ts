// Placeholder for log/event parsing logic
// This file would use the Anchor IDLs for the certificate and licence programs
// to decode the base64 event data found in transaction logs.

const { BorshCoder } = require("@coral-xyz/anchor");

// Assume IDLs are loaded somehow (e.g., require("../idl/creatorclaim_certificate.json"))
// Replace with actual IDL loading
let certificateIdl: any = null;
let licenceIdl: any = null;

let certificateCoder: BorshCoder | null = null;
let licenceCoder: BorshCoder | null = null;

function initializeParsers(certIdl: any, licIdl: any) {
    if (!certIdl || !licIdl) {
        console.warn("IDLs not provided, cannot initialize parsers.");
        return;
    }
    certificateIdl = certIdl;
    licenceIdl = licIdl;
    certificateCoder = new BorshCoder(certificateIdl);
    licenceCoder = new BorshCoder(licenceIdl);
    console.log("Event parsers initialized.");
}

function parseCertificateEvent(log: string) {
    if (!certificateCoder) return null;
    try {
        // Anchor events are typically base64 encoded after "Program data: "
        const eventPrefix = "Program data: ";
        if (log.startsWith(eventPrefix)) {
            const base64Data = log.substring(eventPrefix.length);
            const eventData = certificateCoder.events.decode(base64Data);
            // console.log("Decoded Certificate Event:", eventData);
            return eventData;
        }
    } catch (e) {
        // Might be a log from a different program or not an event
        // console.debug("Could not decode certificate log as event:", e.message);
    }
    return null;
}

function parseLicenceEvent(log: string) {
    if (!licenceCoder) return null;
     try {
        const eventPrefix = "Program data: ";
        if (log.startsWith(eventPrefix)) {
            const base64Data = log.substring(eventPrefix.length);
            const eventData = licenceCoder.events.decode(base64Data);
            // console.log("Decoded Licence Event:", eventData);
            return eventData;
        }
    } catch (e) {
         // console.debug("Could not decode licence log as event:", e.message);
    }
    return null;
}

module.exports = {
    initializeParsers,
    parseCertificateEvent,
    parseLicenceEvent,
};