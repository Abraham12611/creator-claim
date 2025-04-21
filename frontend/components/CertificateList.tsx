<<<<<<< HEAD
import React, { useState, useEffect } from 'react';

// Define an interface for the expected certificate data from the API
interface Certificate {
    asset_id: string;
    creator: string;
    price: string; // Assuming price is returned as string from DB query
    // Add other fields as available from the API (e.g., title, thumbnail from metadata later)
}

const CertificateList: React.FC = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCertificates = async () => {
            setLoading(true);
            setError(null);
            try {
                // TODO: Use environment variable for API base URL
                const response = await fetch('http://localhost:3000/certificates?limit=20'); // Fetch from API
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                // TODO: Add data validation here
                setCertificates(data || []);
            } catch (err: any) {
                console.error("Failed to fetch certificates:", err);
                setError(err.message || "Failed to load certificates.");
                setCertificates([]); // Clear certificates on error
=======
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Certificate, fetchCertificates } from '../lib/api';

interface CertificateListProps {
    searchTerm?: string;
    creator?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
}

const CertificateList: React.FC<CertificateListProps> = ({
    searchTerm,
    creator,
    minPrice,
    maxPrice,
    limit = 20
}) => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const filters = {
                    title: searchTerm,
                    creator,
                    minPrice,
                    maxPrice
                };

                const data = await fetchCertificates({ limit, offset }, filters);
                setCertificates(data);
            } catch (err: any) {
                console.error("Failed to fetch certificates:", err);
                setError(err.message || "Failed to load certificates.");
                setCertificates([]);
>>>>>>> 37ca313 (Auto-commit frontend/components/CertificateList.tsx)
            } finally {
                setLoading(false);
            }
        };

<<<<<<< HEAD
        fetchCertificates();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return <div className="text-center text-neon-accent py-10">Loading certificates...</div>;
=======
        fetchData();
    }, [searchTerm, creator, minPrice, maxPrice, limit, offset]);

    if (loading) {
        return <div className="text-center text-neon-text/70 py-10">Loading certificates...</div>;
>>>>>>> 37ca313 (Auto-commit frontend/components/CertificateList.tsx)
    }

    if (error) {
        return <div className="text-center text-red-500 py-10">Error: {error}</div>;
    }

    if (certificates.length === 0) {
<<<<<<< HEAD
        return <div className="text-center text-gray-400 py-10">No certificates found.</div>;
=======
        return <div className="text-center text-neon-text/70 py-10">No certificates found.</div>;
>>>>>>> 37ca313 (Auto-commit frontend/components/CertificateList.tsx)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {certificates.map((cert) => (
<<<<<<< HEAD
                <div key={cert.asset_id} className="border border-neon-accent rounded-lg p-4 bg-opacity-10 bg-white hover:shadow-lg hover:shadow-neon-primary/20 transition-shadow duration-200">
                    <h3 className="text-lg font-semibold text-neon-primary truncate" title={cert.asset_id}>
                        Asset ID: ...{cert.asset_id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 truncate" title={cert.creator}>
                        Creator: ...{cert.creator.slice(-8)}
                    </p>
                    <p className="text-md font-medium mt-2">
                        Price: {(BigInt(cert.price) / BigInt(10**6)).toString()} USDC {/* Assuming 6 decimals */}
                    </p>
                    {/* TODO: Add link to detail page, image thumbnail */}
                    <button
                        className="mt-4 w-full bg-neon-primary text-neon-bg py-1 px-3 rounded hover:opacity-90 transition-opacity duration-150"
                        // onClick={() => handlePurchase(cert.asset_id)} // Add purchase logic later
                    >
                        View / License
                    </button>
                </div>
=======
                <Link href={`/certificate/${cert.id}`} key={cert.id} className="block group">
                    <div className="border border-neon-lilac/30 rounded-lg overflow-hidden bg-midnight-navy/60 hover:border-neon-lilac transition-colors duration-200 shadow-md hover:shadow-neon-lilac/20">
                        <div className="aspect-video bg-black/30 flex items-center justify-center">
                            {cert.imageUrl ? (
                                <Image
                                    src={cert.imageUrl}
                                    alt={cert.title}
                                    width={300}
                                    height={200}
                                    className="object-cover w-full h-full group-hover:opacity-90 transition-opacity"
                                />
                            ) : (
                                <span className="text-neon-text/50 text-sm">No Preview</span>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-pure-white truncate group-hover:text-electric-cyan transition-colors" title={cert.title}>
                                {cert.title}
                            </h3>
                            {cert.creator && (
                                <p className="text-sm text-neon-text/70 mt-1 truncate" title={cert.creator}>
                                    Creator: {cert.creator}
                                </p>
                            )}
                            {typeof cert.price === 'number' && (
                                <p className="text-md font-medium text-electric-cyan mt-2">
                                    {cert.price.toFixed(2)} USDC
                                </p>
                            )}
                        </div>
                    </div>
                </Link>
>>>>>>> 37ca313 (Auto-commit frontend/components/CertificateList.tsx)
            ))}
        </div>
    );
};

export default CertificateList;