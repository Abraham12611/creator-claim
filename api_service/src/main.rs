use tokio; // Async runtime
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use dotenvy::dotenv;
use std::net::SocketAddr;

// Import local modules
mod db;
mod handlers;

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

    // Create database connection pool
    let db_pool = match db::create_pool().await {
        Ok(pool) => pool,
        Err(e) => {
            tracing::error!("Failed to create database pool: {}", e);
            std::process::exit(1);
        }
    };

    // Create the Axum router
    let app = handlers::create_router(db_pool);

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