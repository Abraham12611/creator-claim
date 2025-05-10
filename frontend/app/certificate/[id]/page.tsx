'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Use for client components
import Image from 'next/image';
import NavigationBar from '../../../components/NavigationBar';
import { Certificate, fetchCertificateById } from '../../../lib/api';
import LicenceCheckoutModal from '../../../components/LicenceCheckoutModal'; // Import the modal

export default function CertificateDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false); // State to control modal visibility

  useEffect(() => {
    if (id) {
      const loadCertificate = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchCertificateById(id);
          if (data) {
            setCertificate(data);
          } else {
            setError('Certificate not found.');
          }
        } catch (err: any) {
          console.error("Failed to fetch certificate:", err);
          setError(err.message || 'Failed to load certificate details.');
        } finally {
          setLoading(false);
        }
      };
      loadCertificate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen font-sans">
        <NavigationBar />
        <main className="flex-grow container mx-auto px-6 py-12 flex justify-center items-center">
          <p className="text-neon-text/70">Loading certificate details...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen font-sans">
        <NavigationBar />
        <main className="flex-grow container mx-auto px-6 py-12 flex justify-center items-center">
          <p className="text-red-500">Error: {error}</p>
        </main>
      </div>
    );
  }

  if (!certificate) {
    // This case might be redundant if error handles 'not found', but good for safety
    return (
      <div className="flex flex-col min-h-screen font-sans">
        <NavigationBar />
        <main className="flex-grow container mx-auto px-6 py-12 flex justify-center items-center">
          <p className="text-neon-text/70">Certificate not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <NavigationBar />
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left side: Image */}
          <div className="aspect-square bg-midnight-navy/50 border border-neon-lilac/20 rounded-lg flex items-center justify-center overflow-hidden">
            {certificate.imageUrl ? (
              <Image
                src={certificate.imageUrl}
                alt={certificate.title}
                width={600}
                height={600}
                className="object-contain w-full h-full"
                priority // Prioritize loading the main image
              />
            ) : (
              <div className="text-center text-neon-text/50">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p>No Image Preview</p>
              </div>
            )}
          </div>

          {/* Right side: Details & Purchase Button */}
          <div className="flex flex-col justify-start">
            <h1 className="text-4xl font-bold text-pure-white mb-4">{certificate.title}</h1>

            <div className="mb-4">
              <span className="text-sm text-neon-text/70">Creator:</span>
              <p className="text-md text-pure-white font-mono truncate" title={certificate.creator}>{certificate.creator || 'Unknown'}</p>
            </div>

            {certificate.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-electric-cyan mb-2">Description</h3>
                <p className="text-neon-text/90 whitespace-pre-wrap">{certificate.description}</p>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-electric-cyan mb-2">Licence Details</h3>
              {/* Placeholder for actual licence template details */}
              <p className="text-neon-text/90">Standard Non-Exclusive Licence (Placeholder)</p>
            </div>

            {typeof certificate.price === 'number' && (
              <div className="mb-8">
                <span className="text-2xl font-bold text-electric-cyan">{certificate.price.toFixed(2)} USDC</span>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto px-8 py-3 bg-electric-cyan hover:bg-electric-cyan/90 text-midnight-navy font-bold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:ring-offset-2 focus:ring-offset-midnight-blue"
            >
              Purchase Licence
            </button>
          </div>
        </div>
      </main>

      {/* Conditionally render the modal */}
      {showModal && certificate && (
        <LicenceCheckoutModal
          certificate={certificate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}