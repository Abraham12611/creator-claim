'use client';

import React, { useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Certificate } from '../lib/api';
import { purchaseLicence } from '../lib/anchor-client';

interface LicenceCheckoutModalProps {
  certificate: Certificate;
  onClose: () => void;
}

const LicenceCheckoutModal: React.FC<LicenceCheckoutModalProps> = ({ certificate, onClose }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, wallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const handlePurchase = useCallback(async () => {
    if (!connected || !publicKey || !wallet) {
      setError('Please connect your wallet first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setExplorerUrl(null);

    try {
      // Validate certificate has an ID and price
      if (!certificate.id) {
        throw new Error('Certificate ID is missing');
      }

      if (typeof certificate.price !== 'number') {
        throw new Error('Certificate price is not available');
      }

      console.log("Initiating licence purchase for certificate:", certificate.id);

      // Convert price to lamports or smallest token unit (USDC has 6 decimals)
      const priceInSmallestUnit = Math.floor(certificate.price * 1_000_000); // Convert to USDC's smallest unit

      // Call our license purchase utility
      const result = await purchaseLicence(
        connection,
        wallet,
        certificate.id,
        priceInSmallestUnit
      );

      console.log("Purchase transaction successful:", result.signature);
      setSuccess(`Purchase successful! Transaction ID: ${result.signature}`);

      // Set the explorer URL if available
      if (result.explorerUrl) {
        setExplorerUrl(result.explorerUrl);
      }

    } catch (err: any) {
      console.error("Purchase failed:", err);
      setError(err.message || 'An unexpected error occurred during purchase.');
    } finally {
      setIsLoading(false);
    }
  }, [connected, publicKey, wallet, connection, certificate]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-midnight-blue border border-neon-lilac/50 rounded-lg shadow-xl max-w-md w-full p-6 relative text-pure-white overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neon-text/70 hover:text-pure-white transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 className="text-2xl font-bold text-electric-cyan mb-4">Confirm Licence Purchase</h2>

        {/* Certificate Summary */}
        <div className="mb-5 p-4 border border-neon-lilac/20 rounded-md bg-midnight-navy/50">
          <p className="text-lg font-semibold truncate" title={certificate.title}>{certificate.title}</p>
          <p className="text-sm text-neon-text/70 truncate" title={certificate.creator || 'Unknown'}>
            Creator: {certificate.creator || 'Unknown'}
          </p>
          {typeof certificate.price === 'number' && (
            <p className="text-xl font-bold text-electric-cyan mt-2">{certificate.price.toFixed(2)} USDC</p>
          )}
        </div>

        {/* Licence Terms Placeholder */}
        <div className="mb-5">
          <h3 className="text-md font-semibold text-neon-text mb-1">Licence Terms</h3>
          <p className="text-xs text-neon-text/70 bg-black/20 p-2 rounded border border-neon-lilac/10">
            This is a placeholder for the actual licence terms (e.g., Standard Non-Exclusive). You will receive the full terms upon successful purchase. By proceeding, you agree to these terms.
            {/* TODO: Fetch and display actual summarized terms */}
          </p>
        </div>

        {/* Wallet Connection / Action Button */}
        <div className="mt-6">
          {!connected ? (
            <div className="flex flex-col items-center">
              <p className="text-amber-400 mb-3 text-center">Please connect your wallet to purchase.</p>
              <WalletMultiButton style={{
                backgroundColor: '#4F46E5', // Indigo-600 like color
                color: 'white',
                border: '1px solid #6366F1',
                borderRadius: '0.375rem' // rounded-md
              }} />
            </div>
          ) : success ? (
            <div className="text-center p-4 bg-green-900/50 border border-emerald-500 rounded-md">
              <p className="font-semibold text-emerald-300 mb-2">Purchase Successful!</p>
              <p className="text-xs text-emerald-200 break-all">Tx: {success.split(": ")[1]}</p>

              {explorerUrl && (
                <div className="mt-2 mb-3">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white py-1 px-3 rounded inline-flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Solana Explorer
                  </a>
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-1 py-1 px-3 text-sm bg-emerald-600 hover:bg-emerald-500 rounded"
              >Close</button>
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-lg font-bold transition-colors duration-200 flex items-center justify-center gap-2
                ${isLoading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-electric-cyan hover:bg-electric-cyan/90 text-midnight-navy'}
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : `Confirm Purchase (${certificate.price?.toFixed(2) || '?'} USDC)`}
            </button>
          )}
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenceCheckoutModal;
