const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketService } = require('./dist/websocket_service');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    connected_clients: wsService.getConnectedClientsCount()
  });
});

// Example endpoint to manually trigger royalty events (for testing)
app.post('/api/royalty-event', (req, res) => {
  try {
    const event = req.body;

    // Validate request
    if (!event.id || !event.amount || !event.recipientWallet) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Broadcast the event
    wsService.broadcastRoyaltyEvent(event);

    // Return success
    res.json({ success: true, message: 'Event broadcast initiated' });
  } catch (error) {
    console.error('Error broadcasting event:', error);
    res.status(500).json({ error: 'Failed to broadcast event' });
  }
});

// Handle connection to the main Rust API
app.get('/api/connect-info', (req, res) => {
  res.json({
    ws_url: `ws://${req.headers.host}`,
    rust_api_url: process.env.RUST_API_URL || 'http://localhost:3000'
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});