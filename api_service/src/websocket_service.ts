import WebSocket from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

interface Client {
  id: string;
  ws: WebSocket;
  userId?: string; // Associated user ID if authenticated
  walletAddress?: string; // Wallet address for filtering royalty events
}

interface RoyaltyEvent {
  id: string;
  timestamp: string;
  amount: number;
  source: string;
  certificateId: string;
  certificateTitle: string;
  recipientWallet: string;
}

export class WebSocketService {
  private server: WebSocket.Server;
  private clients: Map<string, Client> = new Map();

  constructor(httpServer: http.Server) {
    this.server = new WebSocket.Server({ server: httpServer });
    this.initialize();
    console.log('WebSocket server initialized');
  }

  private initialize() {
    this.server.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const clientId = uuidv4();

      // Extract query parameters to identify the client (wallet address, auth token, etc.)
      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const walletAddress = urlParams.get('wallet') || undefined;

      // Store client information
      const client: Client = {
        id: clientId,
        ws,
        walletAddress
      };

      this.clients.set(clientId, client);
      console.log(`Client connected: ${clientId}${walletAddress ? `, Wallet: ${walletAddress}` : ''}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        message: 'Connected to CreatorClaim royalty stream',
        clientId
      });

      // Handle incoming messages
      ws.on('message', (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error(`Error handling message from client ${clientId}:`, error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Handle different message types
    switch (message.type) {
      case 'register_wallet':
        // Update client with wallet address for filtering events
        if (message.walletAddress) {
          client.walletAddress = message.walletAddress;
          console.log(`Client ${clientId} registered wallet: ${message.walletAddress}`);
          this.sendToClient(clientId, {
            type: 'registration_success',
            walletAddress: message.walletAddress
          });
        }
        break;

      case 'ping':
        // Respond to ping messages to keep connection alive
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        console.log(`Received unknown message type from client ${clientId}:`, message);
    }
  }

  // Send a message to a specific client
  private sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  // Send a royalty event to all clients or specific clients based on wallet address
  public broadcastRoyaltyEvent(event: RoyaltyEvent) {
    this.clients.forEach((client) => {
      // If client has registered a wallet, only send events for that wallet
      if (!client.walletAddress || client.walletAddress === event.recipientWallet) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify({
            type: 'royalty_event',
            event
          }));
        }
      }
    });
  }

  // Get the number of connected clients
  public getConnectedClientsCount(): number {
    return this.clients.size;
  }

  // Close all connections and stop the server
  public close() {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    });
    this.server.close();
    console.log('WebSocket server closed');
  }
}

// Example of how to use this service with an HTTP server:
/*
import express from 'express';
import http from 'http';
import { WebSocketService } from './websocket_service';

const app = express();
const server = http.createServer(app);
const wsService = new WebSocketService(server);

// Later, when a royalty event occurs:
wsService.broadcastRoyaltyEvent({
  id: 'event-123',
  timestamp: new Date().toISOString(),
  amount: 5.25,
  source: 'Certificate License',
  certificateId: 'cert-456',
  certificateTitle: 'Abstract Neon City',
  recipientWallet: 'wallet-789'
});

server.listen(3000, () => {
  console.log('Server started on port 3000');
});
*/