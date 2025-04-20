use axum::{
    extract::{State, Path, Query},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use super::db::{DbPool, get_certificates, get_certificate_by_id, get_licences, get_licence_by_pda}; // Assuming db module is in the same crate root

// Shared application state (including the DB pool)
#[derive(Clone)]
pub struct AppState {
    pool: DbPool,
}

// Helper function to create the main router
pub fn create_router(pool: DbPool) -> Router {
    let app_state = AppState { pool };

    Router::new()
        .route("/health", get(health_check_handler))
        .route("/certificates", get(list_certificates_handler))
        .route("/certificates/:asset_id", get(get_certificate_handler))
        .route("/licences", get(list_licences_handler))
        .route("/licences/:licence_pda", get(get_licence_handler))
        // TODO: Add routes for /royalties, /payouts (POST for payouts?)
        .with_state(app_state) // Share the state with all handlers
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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
    State(state): State<AppState>,
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

// TODO: Implement handlers for other routes