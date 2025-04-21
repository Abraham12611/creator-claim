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
use std::fmt;

// --- Placeholder User Structure ---
// This would be populated after validating the JWT
#[derive(Debug, Clone, Serialize)]
pub struct AuthenticatedUser {
    pub user_id: String, // e.g., Clerk user ID, Auth0 sub
    pub wallet_address: Option<String>, // Potentially linked wallet
    // Add other relevant claims (email, name, etc.)
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
            AuthErrorType::MissingToken => StatusCode::UNAUTHORIZED,
            AuthErrorType::InvalidToken => StatusCode::UNAUTHORIZED,
            AuthErrorType::ExpiredToken => StatusCode::UNAUTHORIZED,
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


// Placeholder function to simulate token validation
async fn validate_token(token: &str) -> Result<AuthenticatedUser, AuthError> {
    tracing::debug!("Placeholder: Validating token {}", token);
    // --- Replace with actual JWT validation logic ---
    // 1. Check token format (Bearer ...)
    // 2. Decode token without verification to check headers (alg, kid)
    // 3. Fetch JWKS from Clerk/Auth0 endpoint
    // 4. Find the correct public key using `kid`
    // 5. Verify token signature and claims (issuer, audience, expiry)
    // 6. Extract user info (sub, wallet address if present, etc.)

    // Placeholder: Assume valid if token is "valid-token"
    if token == "valid-token" {
        Ok(AuthenticatedUser {
            user_id: "user_123_placeholder".to_string(),
            wallet_address: Some("WalletPlaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxx".to_string()),
        })
    } else if token == "expired-token" {
        Err(AuthError::new(AuthErrorType::ExpiredToken, "Token has expired (placeholder)"))
    } else {
         Err(AuthError::new(AuthErrorType::InvalidToken, "Invalid token provided (placeholder)"))
    }
}

// --- Axum Middleware & Extractor ---

// Middleware function to enforce authentication
pub async fn require_auth(
    headers: HeaderMap,
    mut request: axum::extract::Request,
    next: Next
) -> Result<Response, AuthError>
{
    tracing::debug!("Executing auth middleware...");
    let auth_header = headers.get(AUTHORIZATION)
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "));

    match auth_header {
        Some(token) => {
            match validate_token(token).await {
                Ok(user) => {
                    // Insert the user into request extensions for handlers to use
                    request.extensions_mut().insert(user);
                    tracing::debug!("Auth successful, proceeding to next handler.");
                    Ok(next.run(request).await)
                }
                Err(e) => {
                    tracing::warn!("Auth failed: {}", e);
                    Err(e)
                }
            }
        }
        None => {
            tracing::warn!("Auth failed: Missing Authorization header.");
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