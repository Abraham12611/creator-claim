// config.rs
// Defines configuration structures, potentially loaded from .env or other sources.

use serde::Deserialize; // Needed if loading from file/env vars with figment etc.

#[derive(Clone, Debug)] // Added Debug
pub struct Auth0Config {
    pub domain: String,   // e.g., "dev-....us.auth0.com"
    pub audience: String, // API Identifier
    pub issuer: String,   // e.g., "https://dev-....us.auth0.com/"
}