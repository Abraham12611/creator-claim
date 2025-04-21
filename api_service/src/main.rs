use tokio; // Async runtime
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use dotenvy::dotenv;
use std::{net::SocketAddr, env, sync::Arc};

// Import local modules
mod db;
mod handlers;
mod auth; // Declare the auth module
mod config; // Declare config module
mod jwks; // Declare jwks module

// Use the config struct
use config::Auth0Config;

// Define the combined AppState here or in handlers.rs
// For simplicity, keeping it here for now
#[derive(Clone)]
pub struct AppState {
    pool: db::DbPool,
    auth_cfg: Arc<Auth0Config>, // Wrap config in Arc for sharing
}

#[tokio::main]
async fn main() {
    // Load .env file if it exists
    dotenv().ok();

    // Initialize tracing (for logging)
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "api_service=info,tower_http=info".into()))
        .with(fmt::layer())
        .init();

    tracing::info!("Starting API service...");

    // Load Auth0 configuration from environment variables
    let auth0_domain = env::var("AUTH0_DOMAIN").expect("AUTH0_DOMAIN must be set");
    let auth0_audience = env::var("AUTH0_AUDIENCE").expect("AUTH0_AUDIENCE must be set");
    // Construct issuer URL correctly
    let auth0_issuer = format!("https://{}/", auth0_domain.trim_end_matches('/'));

    let auth_cfg = Arc::new(Auth0Config {
        domain: auth0_domain,
        audience: auth0_audience,
        issuer: auth0_issuer,
    });
    tracing::info!(domain = %auth_cfg.domain, audience = %auth_cfg.audience, issuer = %auth_cfg.issuer, "Auth0 config loaded");

    // Create database connection pool
    let db_pool = match db::create_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            tracing::error!("Failed to create database pool: {}", e);
            std::process::exit(1);
        }
    };

    // Create the shared AppState
    let app_state = AppState {
        pool: db_pool,
        auth_cfg: auth_cfg.clone(),
    };

    // Create the Axum router, passing the full state
    let app = handlers::create_router(app_state);

    // Define the address to listen on
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000)); // Listen on all interfaces, port 3000
    tracing::info!("Listening on {}", addr);

    // Run the server
    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => listener,
        Err(e) => {
            tracing::error!("Failed to bind to address {}: {}", addr, e);
            std::process::exit(1);
        }
    };

    if let Err(e) = axum::serve(listener, app).await {
        tracing::error!("Server error: {}", e);
    }
}