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
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchTerm, creator, minPrice, maxPrice, limit, offset]);

    if (loading) {
        return <div className="text-center text-neon-text/70 py-10">Loading certificates...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-10">Error: {error}</div>;
    }

    if (certificates.length === 0) {
        return <div className="text-center text-neon-text/70 py-10">No certificates found.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {certificates.map((cert) => (
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
            ))}
        </div>
    );
};

export default CertificateList;