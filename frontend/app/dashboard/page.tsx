'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import Image from 'next/image';
import {
    fetchDashboardStats, DashboardStats,
    fetchRecentSales, RecentSale,
    fetchCertificatesByCreator, Certificate
} from '../../lib/api'; // Adjusted import path
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import NavigationBar from '../../components/NavigationBar';
import RoyaltyWsClient from '../../components/RoyaltyWsClient';

// Helper to format date
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Helper to format currency
const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    // Ensure it's a number before formatting
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return 'Invalid Amount';
    return numericAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

const DashboardPage = () => {
    const { publicKey, connected } = useWallet();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (connected && publicKey) {
            const loadDashboardData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const creatorAddress = publicKey.toBase58();
                    // Fetch all data in parallel
                    const [statsData, salesData, certsData] = await Promise.all([
                        fetchDashboardStats(creatorAddress),
                        fetchRecentSales(creatorAddress, 5),
                        fetchCertificatesByCreator(creatorAddress)
                    ]);
                    setStats(statsData);
                    setRecentSales(salesData);
                    setUserCertificates(certsData);
                } catch (err) {
                    console.error("Failed to load dashboard data:", err);
                    setError("Failed to load dashboard data. Please try refreshing.");
                } finally {
                    setIsLoading(false);
                }
            };
            loadDashboardData();
        } else {
            // Reset data if wallet disconnects
            setStats(null);
            setRecentSales([]);
            setUserCertificates([]);
            setIsLoading(false);
            setError(null);
        }
    }, [connected, publicKey]);

    return (
        <div className="flex flex-col min-h-screen font-sans bg-black text-pure-white">
            <NavigationBar />

            <main className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-pure-white mb-8">Creator Dashboard</h1>

                {!connected ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-midnight-navy/30 border border-neon-lilac/20 rounded-lg">
                        <p className="text-neon-text mb-6">Connect your wallet to view your creator dashboard</p>
                        <WalletMultiButton />
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-400">Loading dashboard data...</p>
                    </div>
                ) : error ? (
                     <div className="text-center py-10 text-red-500">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Section */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Total Certificates" value={stats?.totalCertificates ?? 0} />
                            <StatCard title="Total Royalties (Est.)" value={formatCurrency(stats?.totalRoyaltiesEarned)} />
                            {/* Wallet display remains as is */}
                            <div className="bg-midnight-navy/40 border border-neon-lilac/20 rounded-lg p-6">
                                <h3 className="text-neon-text/70 text-sm uppercase">Wallet</h3>
                                <p className="text-sm font-mono text-neon-text/90 truncate" title={publicKey?.toString()}>{publicKey?.toString()}</p>
                            </div>
                        </div>

                        {/* Live Royalty Stream - Remains as is */}
                        <div className="bg-midnight-navy/40 border border-neon-lilac/20 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-pure-white mb-4">Live Royalty Stream</h2>
                            <RoyaltyWsClient />
                        </div>

                        {/* Your Certificates Section */}
                        <div className="bg-midnight-navy/40 border border-neon-lilac/20 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-pure-white mb-4">Your Certificates</h2>
                            {userCertificates.length > 0 ? (
                                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Added scroll */}
                                    {userCertificates.map(cert => (
                                         <li key={cert.id} className="flex items-center space-x-3 text-sm">
                                            <div className="flex-shrink-0 w-10 h-10 relative rounded overflow-hidden bg-gray-700">
                                                <Image
                                                    src={cert.imageUrl || '/placeholder-image.png'}
                                                    alt={cert.title}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    sizes="40px"
                                                    className="bg-gray-800" // Background while loading
                                                />
                                            </div>
                                            <div>
                                                <Link href={`/certificate/${cert.id}`} className="hover:text-electric-cyan font-medium block truncate" title={cert.title}>
                                                    {cert.title}
                                                </Link>
                                                <p className="text-xs text-gray-400">Price: {formatCurrency(cert.price)}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                             ) : (
                                <p className="text-neon-text/70">You haven't minted any certificates yet.</p>
                             )}
                            <Link href="/mint">
                                <button className="mt-4 w-full bg-electric-cyan text-midnight-navy font-semibold py-2 px-4 rounded hover:bg-opacity-80 transition-colors">
                                    Mint New Certificate
                                </button>
                            </Link>
                        </div>

                        {/* Recent Sales Section */}
                        <div className="bg-midnight-navy/40 border border-neon-lilac/20 rounded-lg p-6">
                            <h2 className="text-xl font-bold text-pure-white mb-4">Recent Licence Sales</h2>
                             {recentSales.length > 0 ? (
                                <ul className="space-y-3 max-h-60 overflow-y-auto pr-2"> {/* Added scroll */}
                                    {recentSales.map(sale => (
                                        <li key={sale.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-b-0">
                                            <div>
                                                <Link href={`/certificate/${sale.certificateId}`} className="hover:text-electric-cyan font-medium">
                                                    {sale.certificateTitle}
                                                </Link>
                                                <p className="text-xs text-gray-400">Sold to: {sale.buyer.substring(0, 6)}...{sale.buyer.substring(sale.buyer.length - 4)}</p>
                                                <p className="text-xs text-gray-500">{formatDate(sale.timestamp)}</p>
                                            </div>
                                            <span className="font-semibold text-electric-cyan">{formatCurrency(sale.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-neon-text/70">No recent sales found.</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// Simple Stat Card Component
interface StatCardProps {
    title: string;
    value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
    <div className="bg-midnight-navy/40 border border-neon-lilac/20 rounded-lg p-6">
        <h3 className="text-neon-text/70 text-sm uppercase">{title}</h3>
        <p className="text-4xl font-bold text-pure-white">{value}</p>
    </div>
);

export default DashboardPage;