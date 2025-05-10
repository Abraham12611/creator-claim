'use client';

import React, { useEffect, useState, useRef } from 'react';

interface RoyaltyStreamWidgetProps {
  publicKey: string;
}

interface RoyaltyEvent {
  id: string;
  timestamp: string;
  amount: number;
  source: string;
  certificateId: string;
  certificateTitle: string;
}

// Placeholder function to simulate incoming royalty events
// In a real implementation, this would be replaced with a WebSocket connection
const simulateRoyaltyEvents = (callback: (event: RoyaltyEvent) => void) => {
  // Random event generator
  const generateRandomEvent = () => {
    const id = Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();
    const amount = parseFloat((Math.random() * 5 + 0.5).toFixed(2));

    const sources = ['Certificate License', 'Royalty Split', 'Secondary Sale'];
    const source = sources[Math.floor(Math.random() * sources.length)];

    const certificates = [
      { id: 'cert1', title: 'Abstract Neon City' },
      { id: 'cert2', title: 'Mountain Landscape Photo' },
      { id: 'cert3', title: 'Digital Painting Asset Pack' },
      { id: 'cert4', title: 'UI Component Library' },
      { id: 'cert5', title: 'Ambient Drone Textures' }
    ];

    const certificate = certificates[Math.floor(Math.random() * certificates.length)];

    return {
      id,
      timestamp,
      amount,
      source,
      certificateId: certificate.id,
      certificateTitle: certificate.title
    };
  };

  // Initial event after 3 seconds
  setTimeout(() => {
    callback(generateRandomEvent());
  }, 3000);

  // Subsequent random events
  const interval = setInterval(() => {
    // 30% chance of emitting an event
    if (Math.random() < 0.3) {
      callback(generateRandomEvent());
    }
  }, 5000);

  // Return cleanup function
  return () => clearInterval(interval);
};

const RoyaltyStreamWidget: React.FC<RoyaltyStreamWidgetProps> = ({ publicKey }) => {
  const [events, setEvents] = useState<RoyaltyEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastAmount, setLastAmount] = useState<number | null>(null);
  const latestEventRef = useRef<HTMLDivElement>(null);

  // Effect for setting up the real-time connection
  useEffect(() => {
    if (!publicKey) return;

    // In a real implementation, this would establish a WebSocket connection
    // to the backend service to receive real-time royalty events.
    console.log("Establishing connection for royalty stream...");

    setIsConnected(true);

    // Simulate royalty events (replace with actual WebSocket listener)
    const cleanup = simulateRoyaltyEvents((event) => {
      setEvents(prev => {
        // Keep only the most recent 10 events
        const newEvents = [event, ...prev].slice(0, 10);
        return newEvents;
      });

      // Trigger animation effect
      setLastAmount(event.amount);
      setTimeout(() => setLastAmount(null), 3000);
    });

    return () => {
      // Clean up the simulation or WebSocket connection
      console.log("Disconnecting royalty stream...");
      setIsConnected(false);
      cleanup();
    };
  }, [publicKey]);

  // Scroll to latest event when new events arrive
  useEffect(() => {
    if (latestEventRef.current && events.length > 0) {
      latestEventRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  // Format timestamp to a readable time
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-full">
      {/* Connection status indicator */}
      <div className="flex items-center mb-4">
        <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
        <span className="text-sm text-neon-text/70">
          {isConnected ? 'Connected to royalty stream' : 'Disconnected'}
        </span>

        {/* Latest royalty notification */}
        {lastAmount !== null && (
          <div className="ml-auto flex items-center bg-electric-cyan/20 text-electric-cyan px-3 py-1 rounded-full animate-pulse">
            <span className="text-sm">+${lastAmount.toFixed(2)} received</span>
          </div>
        )}
      </div>

      {/* Events container */}
      <div className="bg-midnight-navy/30 border border-neon-lilac/10 rounded-lg h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neon-text/50">
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Waiting for royalty payments...</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {events.map((event, index) => (
              <div
                key={event.id}
                ref={index === 0 ? latestEventRef : null}
                className={`p-3 border-l-4 border-electric-cyan rounded bg-midnight-navy/40 ${index === 0 ? 'animate-fadeIn' : ''}`}
              >
                <div className="flex justify-between">
                  <span className="text-neon-text/80 text-sm">{formatTime(event.timestamp)}</span>
                  <span className="text-electric-cyan font-bold">+${event.amount.toFixed(2)}</span>
                </div>
                <p className="text-pure-white text-sm mt-1">{event.certificateTitle}</p>
                <p className="text-neon-text/60 text-xs">{event.source}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-neon-text/50 mt-2">
        Live updates may take a few moments to appear. The stream displays the most recent 10 events.
      </p>
    </div>
  );
};

export default RoyaltyStreamWidget;