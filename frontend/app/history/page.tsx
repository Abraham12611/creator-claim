'use client'; // Likely needs client-side fetching later

import React, { useState, useEffect, useCallback } from 'react';
import NavigationBar from '../../components/NavigationBar'; // Adjust path if needed
import Link from 'next/link'; // Added Link import
import { useWallet } from '@solana/wallet-adapter-react'; // Added wallet hooks
import { useConnection } from '@solana/wallet-adapter-react';
import { WebIrys } from '@irys/sdk'; // Import WebIrys instead of Irys
import { PublicKey } from '@solana/web3.js';

// Updated structure (removed solanaTx)
interface HistoryItem {
  id: string; // Arweave TX ID or local ID
  title: string;
  metadataUri: string;
  timestamp: string;
  nftAddress?: string; // Add optional NFT address field
}

// Function to fetch history via Arweave GraphQL
async function fetchArweaveHistory(irysAddress: string, walletAddress?: string): Promise<HistoryItem[]> {
  const query = `
    query($tags:[TagFilter!]) {
      transactions(
        first: 100 # Limit results for now
        tags: $tags
        sort: HEIGHT_DESC
      ) {
        edges {
          node {
            id
            tags { name value }
            block { timestamp }
          }
        }
      }
    }`;

  const graphqlEndpoint = 'https://arweave.net/graphql'; // Use standard Arweave endpoint

  // Create query tags to search by both irysAddress (as owner) and app name
  // Also search by wallet address if provided
  const queryTags = [
    { name: "App-Name", values: ["CreatorClaim"] }
  ];

  // If wallet address is provided, add it as an Uploader tag filter
  if (walletAddress) {
    queryTags.push({ name: "Uploader", values: [walletAddress] });
  }

  try {
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: {
            tags: queryTags
          }
        })
      });
      if (!response.ok) {
        throw new Error(`GraphQL query failed: ${response.statusText}`);
      }
      const json = await response.json();

      // Check for GraphQL errors
      if (json.errors) {
          console.error('GraphQL Errors:', json.errors);
          throw new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
      }

      if (!json.data?.transactions?.edges) {
          console.warn('Unexpected GraphQL response structure:', json);
          return []; // Return empty if structure is wrong
      }

      return json.data.transactions.edges.map(({ node }: any) => ({
        id: node.id,
        // Extract title from tags, default if not found
        title: node.tags.find((t: any) => t.name === 'Title')?.value ?? 'Untitled Asset',
        metadataUri: `https://arweave.net/${node.id}`,
        // Convert Unix timestamp (seconds) to ISO string
        timestamp: node.block?.timestamp ? new Date(node.block.timestamp * 1000).toISOString() : new Date(0).toISOString() // Handle cases where block might be null briefly
      }));
  } catch (error) {
      console.error("Failed during fetchArweaveHistory:", error);
      // Re-throw or handle as appropriate for the UI
      throw error;
  }
}

// Function to load history from localStorage
function loadLocalHistory(): HistoryItem[] {
  try {
    console.log("Attempting to load history from localStorage");
    const localRecords = JSON.parse(localStorage.getItem('mintRecords') || '[]');
    console.log("Local records found:", localRecords.length);

    if (localRecords.length > 0) {
      return localRecords.map((record: any, index: number) => ({
        id: `local-${index}`,
        title: record.title || 'Untitled Asset',
        metadataUri: record.metadataUri || '',
        nftAddress: record.nftAddress || '',
        timestamp: record.timestamp || new Date().toISOString()
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading records from localStorage:", error);
    return [];
  }
}

const MintHistoryList = ({
  bundlrInstance,
  isBundlrReady,
  publicKey
}: {
  bundlrInstance: WebIrys | null,
  isBundlrReady: boolean,
  publicKey: PublicKey | null
}) => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isBundlrReady && !bundlrInstance?.address) {
        // Even if Irys isn't ready, we can still show local history
        const localItems = loadLocalHistory();
        if (localItems.length > 0) {
          setHistoryItems(localItems);
          setIsLoading(false);
          return;
        }

        // If no local items and Irys not ready, just set loading to false
        setIsLoading(false);
        return;
      }

      console.log(`Fetching history for address: ${bundlrInstance!.address} and wallet: ${publicKey?.toString()}`);
      setIsLoading(true);
      setError(null);

      // Always load local history first so we have something to show immediately
      const localItems = loadLocalHistory();
      if (localItems.length > 0) {
        setHistoryItems(localItems);
      }

      try {
        // Then try to get items from Arweave
        const arweaveItems = await fetchArweaveHistory(bundlrInstance!.address, publicKey?.toString());

        if (arweaveItems.length > 0) {
          // If we got items from Arweave, show those
          setHistoryItems(arweaveItems);
        } else if (localItems.length > 0) {
          // If no Arweave items but we have local items, keep showing local items
          // (We already set these above, so nothing to do here)
          console.log("No Arweave items found, using local storage records instead");
        } else {
          // No items from either source
          setHistoryItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch history from Arweave:", err);
        // If we already have local items, don't show an error
        if (localItems.length === 0) {
          setError(err instanceof Error ? err.message : "Failed to load minting history.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [isBundlrReady, bundlrInstance, publicKey]); // Update dependency array

  // --- Render Logic ---
  if (isLoading) {
    return <p className="text-neon-text/70">Loading history...</p>;
  }
  if (error) {
     return <p className="text-red-500">Error fetching history: {error}</p>;
  }
  if (historyItems.length === 0) {
    return <p className="text-neon-text/70">No minting history found for this wallet.</p>;
  }
  return (
    <div className="space-y-4">
      {historyItems.map((item) => (
        <div key={item.id} className="bg-midnight-navy/60 p-4 rounded-lg border border-neon-lilac/30 shadow-md">
          <p className="text-pure-white font-semibold text-lg mb-1">{item.title}</p>
          <p className="text-sm text-neon-text/80 truncate mb-1">
            Metadata: <Link
                        href={item.metadataUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-electric-cyan hover:underline"
                      >
                         {item.metadataUri}
                      </Link>
          </p>
          {item.nftAddress && (
            <p className="text-sm text-neon-text/80 truncate mb-1">
              NFT Address: <span className="text-electric-cyan">{item.nftAddress}</span>
            </p>
          )}
          <p className="text-xs text-neon-text/60">
            Timestamp: {new Date(item.timestamp).toLocaleString()}
          </p>
          <p className="text-xs text-neon-text/60">
            Source: {item.id.startsWith('local-') ? 'Local Storage' : 'Arweave'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default function HistoryPage() {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bundlrInstance, setBundlrInstance] = useState<WebIrys | null>(null);
  const [isBundlrReady, setIsBundlrReady] = useState<boolean>(false);
  const [mintStatus, setMintStatus] = useState<string>('');

  const initializeBundlr = useCallback(async () => {
    // Pre-conditions check - ensure wallet and adapter are fully available
    if (!wallet?.adapter || !wallet.adapter.connected || !publicKey || !connection) {
        console.log("History Page: InitializeBundlr pre-conditions not fully met.");
        setIsBundlrReady(false); // Ensure not ready
        return;
    }

    console.log('History Page: Pre-conditions met. Attempting to initialize Irys...');

    // Reset state before initialization
    setIsBundlrReady(false);
    setBundlrInstance(null);
    setMintStatus('Initializing Irys for history...');

    // Explicitly use full URL for devnet
    const network = "https://devnet.irys.xyz";
    const providerUrl = connection.rpcEndpoint;
    const token = "solana";

    console.log(`History Page: Initializing WebIrys instance with wallet: ${wallet.adapter.name}...`);
    try {
        // Create a WebIrys instance with the wallet as the provider
        const webIrys = new WebIrys({
            url: network,
            token,
            wallet: { name: "solana", provider: wallet.adapter },
            config: {
                providerUrl,
                timeout: 60000 // Increase timeout to 60 seconds
            }
        });

        console.log('History Page: Calling webIrys.ready()...');
        await webIrys.ready();
        console.log('History Page: webIrys.ready() completed. Address check:', webIrys.address);

        // Add short delay to ensure address is available
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('History Page: Checking webIrys.address after delay...');
        if (webIrys.address) {
           console.log('History Page: Address confirmed after delay:', webIrys.address);
           setBundlrInstance(webIrys);
           setIsBundlrReady(true);
           setMintStatus('');
           console.log('History Page: Irys successfully initialized.');
        } else {
           console.error("History Page: Irys address undefined after ready() and delay.");
           console.log("History Page: Irys instance state:", webIrys);
           throw new Error("Address is undefined after ready(), please check console logs.");
        }
    } catch (error) {
        console.error("History Page: Error during Irys initialization:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMintStatus(`Error initializing Irys for history: ${errorMessage}`);
        setIsBundlrReady(false); // Ensure state reflects failure
        setBundlrInstance(null); // Clear instance on error
    }
  // Depend only on the core objects needed for initialization
  }, [wallet, connection, publicKey]);

  // Effect to initialize Irys when wallet connects and dependencies are stable
  useEffect(() => {
    // Check if all required elements are present and connected
    if (wallet?.adapter?.connected && publicKey && connection && !isBundlrReady && !bundlrInstance) {
      console.log("History Page: Dependencies stable, triggering Irys initialization.");
      initializeBundlr();
    }
    // Optional: Reset if wallet disconnects
    else if (!wallet?.adapter?.connected && (isBundlrReady || bundlrInstance)) {
        console.log('History Page: Wallet disconnected, resetting Irys state.');
        setBundlrInstance(null);
        setIsBundlrReady(false);
        setMintStatus('');
    }
  // Watch all dependencies needed by initializeBundlr AND the readiness flags
  }, [wallet, connection, publicKey, isBundlrReady, bundlrInstance, initializeBundlr]);

  // Effect to fetch history once Irys is ready
  useEffect(() => {
    const loadHistory = async () => {
      // Check if we can load from localStorage even if Irys isn't ready
      if (!isBundlrReady || !bundlrInstance?.address) {
        const localItems = loadLocalHistory();
        if (localItems.length > 0) {
          setHistoryItems(localItems);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }

      console.log(`Fetching history for address: ${bundlrInstance.address} and wallet: ${publicKey?.toString()}`);
      setIsLoading(true);
      setError(null);

      // Always try to load from localStorage first
      const localItems = loadLocalHistory();
      if (localItems.length > 0) {
        setHistoryItems(localItems);
      }

      try {
        // Pass both the irys address and wallet public key
        const arweaveItems = await fetchArweaveHistory(bundlrInstance.address, publicKey?.toString());

        if (arweaveItems.length > 0) {
          setHistoryItems(arweaveItems);
        } else if (localItems.length > 0) {
          // Keep showing local items if no Arweave items (already set above)
          console.log("Using local storage history as fallback");
        } else {
          // No history from either source
          setHistoryItems([]);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);

        // If we have local items, keep showing them and don't show error
        if (localItems.length === 0) {
          setError(err instanceof Error ? err.message : "Failed to load minting history.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [isBundlrReady, bundlrInstance?.address, publicKey]); // Add publicKey to dependencies

  // --- Render Logic ---
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <NavigationBar />
      <main className="flex-grow container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-pure-white mb-8">Minting History</h1>
        <div className="max-w-4xl">
          {!publicKey ? (
            <p className="text-neon-text/70">Please connect your wallet to view history.</p>
          ) : !isBundlrReady && !error ? ( // Show loading only if not ready and no error
            <p className="text-neon-text/70">{mintStatus || 'Initializing Irys for history...'}</p>
          ) : error ? ( // Show error if one exists
             <p className="text-red-500">Error: {error}</p>
          ): ( // Only render MintHistoryList if ready and no error
            <MintHistoryList
              bundlrInstance={bundlrInstance}
              isBundlrReady={isBundlrReady}
              publicKey={publicKey} // Pass publicKey to MintHistoryList
            />
          )}
        </div>
      </main>
    </div>
  );
}