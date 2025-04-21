use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    middleware,
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use super::db::DbPool;
// Import auth components and config
use super::auth::{require_auth, AuthenticatedUser};
use super::config::Auth0Config;
// Import db functions (make public in db.rs if needed)
use super::db::{get_certificates, get_certificate_by_id, get_licences, get_licence_by_pda, get_royalties, record_payout_request};

// Update AppState to include Auth0Config
#[derive(Clone)]
pub struct AppState {
    pool: DbPool,
    auth_cfg: Arc<Auth0Config>, // Added Auth0 config
}

// Update create_router to accept the combined AppState
pub fn create_router(app_state: AppState) -> Router {
    // Define public routes
    let public_routes = Router::new()
        .route("/health", get(health_check_handler))
        .route("/certificates", get(list_certificates_handler))
        .route("/certificates/:asset_id", get(get_certificate_handler))
        .route("/licences", get(list_licences_handler))
        .route("/licences/:licence_pda", get(get_licence_handler));
        // Add other public routes here

    // Define protected routes that require authentication
    let protected_routes = Router::new()
        .route("/me/licences", get(list_my_licences_handler))
        .route("/me/royalties", get(list_my_royalties_handler))
        .route("/me/payouts", post(initiate_payout_handler)) // Add POST route for payouts
        .route_layer(middleware::from_fn_with_state(app_state.clone(), require_auth)); // Apply auth middleware correctly with state

    // Combine routers and provide the state
    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .with_state(app_state)
}

// --- Route Handlers ---

async fn health_check_handler() -> StatusCode {
    StatusCode::OK
}

#[derive(Deserialize)]
pub struct PaginationParams {
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Deserialize)]
pub struct LicenceFilterParams {
    buyer: Option<String>, // Filter by buyer public key
    asset_id: Option<String>, // Filter by certificate asset_id
    // Add other filters like status?
}

// Handler to list certificates (with basic pagination)
asyn fn list_certificates_handler(
    State(state): State<AppState>, // Uses the combined AppState
    Query(params): Query<PaginationParams>,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    let limit = params.limit.unwrap_or(20); // Default limit
    let offset = params.offset.unwrap_or(0); // Default offset

    match get_certificates(&state.pool, limit, offset).await {
        Ok(certs) => Ok(Json(certs)),
        Err(e) => {
            tracing::error!("Failed to fetch certificates: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch certificates".to_string()))
        }
    }
}

// Handler to get a single certificate by its asset ID
asyn fn get_certificate_handler(
    State(state): State<AppState>, // Uses the combined AppState
    Path(asset_id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    match get_certificate_by_id(&state.pool, &asset_id).await {
        Ok(Some(cert)) => Ok(Json(cert)),
        Ok(None) => Err((StatusCode::NOT_FOUND, format!("Certificate not found: {}", asset_id))),
        Err(e) => {
            tracing::error!("Failed to fetch certificate {}: {}", asset_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch certificate".to_string()))
        }
    }
}

// Handler to list licences (with basic pagination and filtering)
asyn fn list_licences_handler(
    State(state): State<AppState>, // Uses the combined AppState
    Query(page_params): Query<PaginationParams>,
    Query(filter_params): Query<LicenceFilterParams>,
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    let limit = page_params.limit.unwrap_or(20);
    let offset = page_params.offset.unwrap_or(0);

    // Pass filters to DB function (DB function needs implementation)
    match get_licences(&state.pool, filter_params.buyer, filter_params.asset_id, limit, offset).await {
        Ok(licences) => Ok(Json(licences)),
        Err(e) => {
            tracing::error!("Failed to fetch licences: {}", e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch licences".to_string()))
        }
    }
}

// Handler to get a single licence by its PDA
asyn fn get_licence_handler(
    State(state): State<AppState>, // Uses the combined AppState
    Path(licence_pda): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    match get_licence_by_pda(&state.pool, &licence_pda).await {
        Ok(Some(licence)) => Ok(Json(licence)),
        Ok(None) => Err((StatusCode::NOT_FOUND, format!("Licence not found: {}", licence_pda))),
        Err(e) => {
            tracing::error!("Failed to fetch licence {}: {}", licence_pda, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch licence".to_string()))
        }
    }
}

// --- Protected Route Handlers ---

// Example handler for a protected route that lists licences for the authenticated user
asyn fn list_my_licences_handler(
    State(state): State<AppState>, // Uses the combined AppState
    Query(page_params): Query<PaginationParams>,
    user: AuthenticatedUser, // Auth middleware provides this
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    tracing::info!("Fetching licences for authenticated user: {}", user.user_id);

    let limit = page_params.limit.unwrap_or(20);
    let offset = page_params.offset.unwrap_or(0);

    // We need the user's wallet address to filter licences
    // In a real app, the JWT validation should populate this reliably.
    let buyer_wallet = match user.wallet_address {
        Some(addr) => addr,
        None => {
            tracing::warn!("User {} has no linked wallet address for filtering licences.", user.user_id);
            // Return empty list or appropriate error
            return Err((StatusCode::BAD_REQUEST, "User has no linked wallet address.".to_string()));
        }
    };

    // Call DB function, filtering by the authenticated user's wallet
    match get_licences(&state.pool, Some(buyer_wallet), None, limit, offset).await {
        Ok(licences) => Ok(Json(licences)),
        Err(e) => {
            tracing::error!("Failed to fetch licences for user {}: {}", user.user_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch licences".to_string()))
        }
    }
}

// Handler for fetching royalties for the authenticated user
asyn fn list_my_royalties_handler(
    State(state): State<AppState>,
    Query(page_params): Query<PaginationParams>,
    user: AuthenticatedUser, // Auth middleware provides this
) -> Result<Json<Vec<serde_json::Value>>, (StatusCode, String)> {
    tracing::info!("Fetching royalties for authenticated user: {}", user.user_id);

    let limit = page_params.limit.unwrap_or(50); // Default limit for royalties
    let offset = page_params.offset.unwrap_or(0);

    // TODO: The filter might need to be based on user.user_id or a linked beneficiary address
    // This depends on how royalty payments are stored and indexed.
    let user_filter = Some(user.user_id.clone()); // Placeholder filter

    // Call DB function (currently a placeholder)
    match get_royalties(&state.pool, user_filter, None, limit, offset).await {
        Ok(royalties) => Ok(Json(royalties)),
        Err(e) => {
            tracing::error!("Failed to fetch royalties for user {}: {}", user.user_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch royalties".to_string()))
        }
    }
}

// --- Payout Structures ---
#[derive(Deserialize, Debug)]
pub struct PayoutRequestBody {
    amount: i64, // Or use String/Decimal for precision
    currency: String, // e.g., "USDC"
    destination_address: String, // Identifier for payout destination (e.g., bank ID, wallet addr)
}

#[derive(Serialize, Debug)]
pub struct PayoutResponse {
    payout_request_id: String,
    status: String, // e.g., "pending", "processing"
}

// Handler for initiating a payout for the authenticated user
asyn fn initiate_payout_handler(
    State(state): State<AppState>,
    user: AuthenticatedUser, // Auth middleware provides this
    Json(payload): Json<PayoutRequestBody>,
) -> Result<Json<PayoutResponse>, (StatusCode, String)> {
    tracing::info!(user_id = %user.user_id, amount = payload.amount, currency = %payload.currency, "Received payout request");

    // TODO: Add validation logic
    // - Check if user has sufficient available balance (requires balance tracking)
    // - Validate currency and destination address format
    // - Check against payout limits, etc.
    if payload.amount <= 0 {
        return Err((StatusCode::BAD_REQUEST, "Payout amount must be positive.".to_string()));
    }
    if payload.currency != "USDC" { // Example: only allow USDC for now
         return Err((StatusCode::BAD_REQUEST, "Unsupported currency.".to_string()));
    }

    // Call DB function (currently a placeholder)
    match record_payout_request(
        &state.pool,
        &user.user_id,
        payload.amount,
        &payload.currency,
        &payload.destination_address
    ).await {
        Ok(payout_id) => {
            let response = PayoutResponse {
                payout_request_id: payout_id,
                status: "pending".to_string(), // Initial status
            };
            Ok(Json(response))
        },
        Err(e) => {
            tracing::error!("Failed to record payout request for user {}: {}", user.user_id, e);
            Err((StatusCode::INTERNAL_SERVER_ERROR, "Failed to process payout request".to_string()))
        }
    }
}

// TODO: Implement handlers for other protected routes