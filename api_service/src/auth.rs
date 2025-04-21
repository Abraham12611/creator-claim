// Placeholder for JWT authentication logic
// This would typically involve libraries like `jsonwebtoken`, `reqwest` (for JWKS),
// integration with Clerk/Auth0 SDKs, etc.

use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode, HeaderMap, header::AUTHORIZATION},
    response::{Response, IntoResponse, Json},
    middleware::{self, Next},
};
use serde::{Deserialize, Serialize};
use std::{fmt, sync::Arc};

// Import config and jwks helper
use super::config::Auth0Config;
use super::jwks::decoding_key_for_kid;

// --- Placeholder User Structure ---
// This would be populated after validating the JWT
#[derive(Debug, Clone, Serialize)]
pub struct AuthenticatedUser {
    pub user_id: String, // e.g., Clerk user ID, Auth0 sub
    pub wallet_address: Option<String>, // Potentially linked wallet
    // Add other relevant claims (email, name, etc.)
}

// Define the expected structure of claims within the Auth0 JWT
#[derive(Debug, Deserialize)]
struct Claims {
    sub: String, // Subject (User ID)
    iss: String, // Issuer (Auth0 domain URL)
    aud: String, // Audience (Your API identifier)
    exp: usize,  // Expiration time (Unix timestamp)
    email: Option<String>, // Standard claim
    // Add custom claims here if configured in Auth0 rules/actions
    // Example: "https://creatorclaim.com/wallet_address": Option<String>,
}

// --- Placeholder JWT Validation ---

#[derive(Debug, Serialize)]
pub struct AuthError {
    message: String,
    error_type: AuthErrorType,
}

#[derive(Debug, Serialize, PartialEq)]
enum AuthErrorType {
    MissingToken,
    InvalidToken,
    ExpiredToken,
    Unauthorized,
}

impl AuthError {
    fn new(error_type: AuthErrorType, message: &str) -> Self {
        Self { message: message.to_string(), error_type }
    }
}

// Make AuthError usable in Axum error handling
impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let status = match self.error_type {
            AuthErrorType::MissingToken | AuthErrorType::InvalidToken | AuthErrorType::ExpiredToken => StatusCode::UNAUTHORIZED,
            AuthErrorType::Unauthorized => StatusCode::FORBIDDEN,
        };
        (status, Json(self)).into_response()
    }
}

// Implement Display for nice error printing
impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "AuthError ({:?}): {}", self.error_type, self.message)
    }
}

// Implement std::error::Error
impl std::error::Error for AuthError {}

// --- Real JWT Validation ---

async fn validate_token(
    token: &str,
    cfg: &Auth0Config, // Pass Auth0 config
) -> Result<AuthenticatedUser, AuthError>
{
    tracing::debug!("Attempting to validate Auth0 JWT...");

    // 1. Decode header only (to read `kid`)
    let header = jsonwebtoken::decode_header(token)
        .map_err(|e| {
            tracing::warn!("Failed to decode JWT header: {}", e);
            AuthError::new(AuthErrorType::InvalidToken, "Malformed JWT header")
        })?;

    let kid = header.kid.ok_or_else(|| {
        tracing::warn!("JWT header missing 'kid'");
        AuthError::new(AuthErrorType::InvalidToken, "Missing kid in JWT header")
    })?;
    tracing::debug!(kid = %kid, "Extracted kid from header");

    // 2. Get RSA public key from JWKS endpoint (with caching)
    let decoding_key = decoding_key_for_kid(&cfg.domain, &kid).await
        .map_err(|e| {
            // Log the underlying error from JWKS fetch
            tracing::error!("Failed to get decoding key for kid {}: {}", kid, e);
            AuthError::new(AuthErrorType::InvalidToken, "Unknown or unreachable signing key")
        })?;
    tracing::debug!(kid = %kid, "Successfully obtained decoding key");

    // 3. Setup JWT validation parameters
    let mut validation = jsonwebtoken::Validation::new(header.alg);
    validation.set_audience(&[cfg.audience.clone()]);
    validation.set_issuer(&[cfg.issuer.clone()]);
    validation.validate_exp = true; // Ensure expiration is checked
    // Add clock skew if needed: validation.leeway = 60;

    // 4. Decode and validate the token + claims
    let token_data = jsonwebtoken::decode::<Claims>(token, &decoding_key, &validation)
        .map_err(|e| {
            tracing::warn!("JWT validation failed: {}", e);
            match e.kind() {
                jsonwebtoken::errors::ErrorKind::ExpiredSignature =>
                    AuthError::new(AuthErrorType::ExpiredToken, "Token has expired"),
                jsonwebtoken::errors::ErrorKind::InvalidAudience =>
                    AuthError::new(AuthErrorType::InvalidToken, "Invalid token audience"),
                jsonwebtoken::errors::ErrorKind::InvalidIssuer =>
                    AuthError::new(AuthErrorType::InvalidToken, "Invalid token issuer"),
                // Add more specific errors as needed
                _ => AuthError::new(AuthErrorType::InvalidToken, "Invalid JWT signature or claims"),
            }
        })?;
    tracing::debug!(claims = ?token_data.claims, "JWT validation successful");

    // 5. Construct AuthenticatedUser from claims
    Ok(AuthenticatedUser {
        user_id: token_data.claims.sub, // Use 'sub' claim as user ID
        // TODO: Map custom claims like wallet address if they exist
        // wallet_address: token_data.claims.get("https://creatorclaim.com/wallet_address").cloned(),
        wallet_address: None, // Placeholder
    })
}

// --- Axum Middleware & Extractor ---

// Middleware function updated to accept Auth0Config from state
pub async fn require_auth<B>(
    // Extract Auth0Config from the application state
    State(auth_cfg): State<Arc<Auth0Config>>, // Use Arc<Auth0Config>
    headers: HeaderMap,
    mut request: axum::extract::Request<B>,
    next: Next<B>
) -> Result<Response, AuthError>
{
    tracing::debug!("Executing require_auth middleware...");
    let token = headers
        .get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    match token {
        Some(t) => {
            // Pass the config to the validation function
            match validate_token(t, &auth_cfg).await {
                Ok(user) => {
                    request.extensions_mut().insert(user);
                    tracing::debug!("Auth successful, proceeding.");
                    Ok(next.run(request).await)
                }
                Err(e) => {
                    tracing::warn!("Auth validation failed: {}", e);
                    Err(e)
                }
            }
        }
        None => {
            tracing::warn!("Auth failed: Missing Bearer token.");
            Err(AuthError::new(AuthErrorType::MissingToken, "Missing Bearer token"))
        }
    }
}

// Extractor to easily get the authenticated user in handlers
// This runs *after* the middleware has successfully inserted the user
#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts.extensions.get::<AuthenticatedUser>()
            .cloned()
            .ok_or_else(|| {
                tracing::error!("AuthenticatedUser extractor used without validating middleware!");
                 AuthError::new(AuthErrorType::Unauthorized, "Internal error: User not found after auth middleware")
            })
    }
}