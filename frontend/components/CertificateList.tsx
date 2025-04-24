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
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) {
        return <div className="text-center text-neon-accent py-10">Loading certificates...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 py-10">Error: {error}</div>;
    }

    if (certificates.length === 0) {
        return <div className="text-center text-gray-400 py-10">No certificates found.</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {certificates.map((cert) => (
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
            ))}
        </div>
    );
};

export default CertificateList;