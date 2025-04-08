'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
// import { clusterApiUrl } from '@solana/web3.js'; // No longer needed for endpoint

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export function WalletContextProvider({
    children
}: {
    children: React.ReactNode
}) {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet; // Still needed for wallet adapters potentially

    // Use a specific Helius Devnet RPC endpoint
    const endpoint = useMemo(() => 'https://devnet.helius-rpc.com/?api-key=05998eb8-e55c-4d7a-8ee4-0ca8db839ec8', []); // Replace with your actual Helius API key or another public RPC
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]); // Original

    const wallets = useMemo(
        () => [
            // Add wallet adapters
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}