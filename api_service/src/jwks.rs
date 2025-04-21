// jwks.rs
// Handles fetching and caching JSON Web Key Sets (JWKS) for JWT validation.

use anyhow::Context; // Use anyhow for Result chaining convenience
use dashmap::DashMap;
use jsonwebtoken::{jwk::{JwkSet, AlgorithmParameters}, DecodingKey};
use once_cell::sync::Lazy;
use reqwest::Client;
use std::{time::{Duration, Instant}, sync::Arc};

// Static cache for JWKs. Key is the `kid`, Value is (Key, fetched_time)
// Use Arc for the key to avoid cloning the whole key on every check
static JWKS_CACHE: Lazy<DashMap<String, (Arc<DecodingKey<'static>>, Instant)>> =
    Lazy::new(DashMap::new);

// Time-to-live for cached keys
const TTL: Duration = Duration::from_secs(60 * 60); // 1 hour

/**
 * Fetches the appropriate RSA public key (DecodingKey) from the Auth0 JWKS endpoint
 * for a given Key ID (`kid`). Uses a time-based cache.
 */
pub async fn decoding_key_for_kid(domain: &str, kid: &str)
        -> anyhow::Result<Arc<DecodingKey<'static>>>
{
    // Check cache first
    if let Some(entry) = JWKS_CACHE.get(kid) {
        let (key, fetched_at) = entry.value();
        if fetched_at.elapsed() < TTL {
            tracing::debug!(kid, "Returning cached JWKS key");
            return Ok(key.clone());
        }
    }
    tracing::info!(kid, "JWKS key not in cache or expired, fetching...");

    // Construct the JWKS URL
    let url = format!("https://{}/.well-known/jwks.json", domain.trim_end_matches('/'));

    // Fetch the JWKSet
    let client = Client::new(); // Consider creating a reusable client
    let response = client.get(&url).send().await.context("Failed to send JWKS request")?;
    if !response.status().is_success() {
        anyhow::bail!("JWKS request failed with status: {}", response.status());
    }
    let jwks: JwkSet = response.json().await.context("Failed to parse JWKS JSON")?;

    // Find the key with the matching `kid` and extract RSA components
    for key in jwks.keys {
        if key.common.key_id.as_deref() == Some(kid) {
            if let Some(AlgorithmParameters::RSA(rsa_params)) = key.specific.algorithm {
                // Ensure required components are present
                let n = rsa_params.n.context("Missing modulus (n) in JWK")?;
                let e = rsa_params.e.context("Missing exponent (e) in JWK")?;

                // jsonwebtoken expects components as slices
                // We need to own the bytes to make the key 'static. Convert base64url bytes to owned Vec<u8>.
                let n_bytes = n.as_bytes().to_vec();
                let e_bytes = e.as_bytes().to_vec();

                let decoding_key = DecodingKey::from_rsa_components(&n_bytes, &e_bytes)
                    .context("Failed to create DecodingKey from RSA components")?;

                // Convert to 'static lifetime by leaking memory (acceptable for long-lived keys)
                // Or manage lifetimes more carefully if leaking is not desired.
                // For simplicity here, we clone into an Arc.
                let static_key = Arc::new(decoding_key);

                // Cache the key
                JWKS_CACHE.insert(kid.to_owned(), (static_key.clone(), Instant::now()));
                tracing::info!(kid, "Fetched and cached new JWKS key.");
                return Ok(static_key);
            } else {
                 tracing::warn!(kid, alg = ?key.specific.algorithm, "JWK found but is not RSA, skipping");
            }
        }
    }

    tracing::error!(kid, "No matching & valid RSA key found in JWKS for the given kid.");
    anyhow::bail!("No matching & valid RSA key found for kid: {}", kid)
}