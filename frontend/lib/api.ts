// API utilities for certificate-related endpoints

// Base API URL - would typically come from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Certificate {
    id: string;
    title: string;
    creator?: string;
    price?: number;
    imageUrl?: string;
    metadataUri: string;
    description?: string;
    createdAt?: string;
}

interface PaginationParams {
    limit?: number;
    offset?: number;
}

interface CertificateFilters {
    creator?: string;
    title?: string; // For search by title
    minPrice?: number;
    maxPrice?: number;
}

export async function fetchCertificates(
    pagination: PaginationParams = {},
    filters: CertificateFilters = {}
): Promise<Certificate[]> {
    const { limit = 20, offset = 0 } = pagination;

    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    // Add filters if they exist
    if (filters.creator) params.append('creator', filters.creator);
    if (filters.title) params.append('title', filters.title);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());

    try {
        // In development or when API isn't available, use mock data
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_REAL_API) {
            console.log('Using mock certificate data');
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Filter mock data if search term is provided
            const mockData = getMockCertificates();
            return mockData.filter(cert => {
                // Apply title search filter if provided
                if (filters.title && !cert.title.toLowerCase().includes(filters.title.toLowerCase())) {
                    return false;
                }
                // Apply creator filter if provided
                if (filters.creator && cert.creator !== filters.creator) {
                    return false;
                }
                // Apply price filters if provided
                if (filters.minPrice !== undefined && (cert.price || 0) < filters.minPrice) {
                    return false;
                }
                if (filters.maxPrice !== undefined && (cert.price || 0) > filters.maxPrice) {
                    return false;
                }
                return true;
            });
        }

        // Real API call
        const response = await fetch(`${API_BASE_URL}/certificates?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching certificates:', error);
        throw error;
    }
}

export async function fetchCertificateById(id: string): Promise<Certificate | null> {
    try {
        // In development or when API isn't available, use mock data
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_USE_REAL_API) {
            console.log('Using mock certificate data for ID:', id);
            await new Promise(resolve => setTimeout(resolve, 300));
            const mockData = getMockCertificates();
            const certificate = mockData.find(cert => cert.id === id);
            return certificate || null;
        }

        // Real API call
        const response = await fetch(`${API_BASE_URL}/certificates/${id}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching certificate ${id}:`, error);
        throw error;
    }
}

// --- Dashboard Mock Data ---

export interface DashboardStats {
  totalCertificates: number;
  totalRoyaltiesEarned: number; // Assuming USDC
  totalLicencesSold: number;
}

export interface RecentSale {
  id: string; // Transaction ID or Sale ID
  certificateTitle: string;
  certificateId: string;
  buyer: string; // Buyer wallet address
  price: number; // Sale price (USDC)
  timestamp: string;
}

// Mock function to fetch dashboard summary stats
export async function fetchDashboardStats(creatorAddress: string): Promise<DashboardStats> {
  console.log("Fetching dashboard stats for:", creatorAddress);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 400));

  // In a real app, fetch from /api/dashboard/stats?creator=...
  // Filter mock certificates to simulate creator-specific stats
  const userCerts = getMockCertificates().filter(c => c.creator === creatorAddress);

  // Mock calculations
  const mockStats: DashboardStats = {
    totalCertificates: userCerts.length,
    totalRoyaltiesEarned: userCerts.reduce((sum, cert) => sum + (cert.price || 0) * 0.8, 0) * 3, // Simulate multiple sales/royalties
    totalLicencesSold: userCerts.length * 3, // Simulate 3 sales per certificate
  };
  console.log("Mock stats:", mockStats);
  return mockStats;
}

// Mock function to fetch recent sales for a creator's certificates
export async function fetchRecentSales(creatorAddress: string, limit: number = 5): Promise<RecentSale[]> {
    console.log(`Fetching recent sales for ${creatorAddress}, limit ${limit}`);
    await new Promise(resolve => setTimeout(resolve, 600));

    // In a real app, fetch from /api/sales?creator=...&limit=...
    const userCerts = getMockCertificates().filter(c => c.creator === creatorAddress);
    const mockSales: RecentSale[] = userCerts.flatMap((cert, index) => [
        {
            id: `sale-${cert.id}-1`,
            certificateTitle: cert.title,
            certificateId: cert.id,
            buyer: `Buyer...${index}ABC`,
            price: cert.price || 0,
            timestamp: new Date(Date.now() - index * 86400000).toISOString(), // Simulate sales over last few days
        },
         {
            id: `sale-${cert.id}-2`,
            certificateTitle: cert.title,
            certificateId: cert.id,
            buyer: `Buyer...${index}DEF`,
            price: (cert.price || 0) * 1.1, // Slightly different price
            timestamp: new Date(Date.now() - (index + 0.5) * 86400000).toISOString(),
        }
    ]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Sort descending
      .slice(0, limit);

    console.log("Mock recent sales:", mockSales);
    return mockSales;
}

// Mock function to fetch certificates minted by a specific creator
export async function fetchCertificatesByCreator(creatorAddress: string): Promise<Certificate[]> {
    console.log("Fetching certificates for creator:", creatorAddress);
    await new Promise(resolve => setTimeout(resolve, 700));

    // In a real app, call fetchCertificates with the creator filter
    // return fetchCertificates({}, { creator: creatorAddress });
    const userCerts = getMockCertificates().filter(c => c.creator === creatorAddress);
    console.log("Mock user certificates:", userCerts);
    return userCerts;

}

// Mock data function for development
function getMockCertificates(): Certificate[] {
    return [
        {
            id: 'GjZZ8JzVXPfcBhvezbo9jRXEX4mw6ocnUBUytK3cKDKV',
            title: 'Abstract Neon City',
            creator: '4dAq...PajKN',
            price: 10.00,
            imageUrl: 'https://arweave.net/GQr6QyriNiPvUtufddiWnFmb2DS6SWNfMZXf1M9Yzv3g',
            metadataUri: 'https://arweave.net/GjZZ8JzVXPfcBhvezbo9jRXEX4mw6ocnUBUytK3cKDKV',
            description: 'A vibrant neon cityscape with abstract architectural elements',
            createdAt: '2023-11-15T12:34:56Z'
        },
        {
            id: 'another-arweave-id-placeholder',
            title: 'Retro Audio Loop',
            creator: 'Some...ther',
            price: 5.50,
            imageUrl: undefined,
            metadataUri: 'https://arweave.net/another-arweave-id-placeholder',
            description: 'A nostalgic synthwave audio loop perfect for retro gaming projects',
            createdAt: '2023-11-10T09:12:34Z'
        },
        {
            id: 'yet-another-arweave-id',
            title: 'Mountain Landscape Photo',
            creator: '4dAq...PajKN',
            price: 25.00,
            imageUrl: undefined,
            metadataUri: 'https://arweave.net/yet-another-arweave-id',
            description: 'A serene mountain landscape captured at golden hour',
            createdAt: '2023-11-05T16:45:23Z'
        },
        {
            id: 'mock-asset-001',
            title: 'Digital Painting Asset Pack',
            creator: 'DevAr...tist1',
            price: 15.00,
            imageUrl: undefined,
            metadataUri: 'https://arweave.net/mock-asset-001',
            description: 'Collection of 5 digital brushes for concept artists',
            createdAt: '2023-10-28T14:22:11Z'
        },
        {
            id: 'mock-asset-002',
            title: 'UI Component Library',
            creator: 'UX...sign',
            price: 30.00,
            imageUrl: undefined,
            metadataUri: 'https://arweave.net/mock-asset-002',
            description: 'Comprehensive library of cyberpunk-themed UI elements',
            createdAt: '2023-10-22T08:15:43Z'
        },
        {
            id: 'mock-asset-003',
            title: 'Ambient Drone Textures',
            creator: 'Sound...ker',
            price: 12.50,
            imageUrl: undefined,
            metadataUri: 'https://arweave.net/mock-asset-003',
            description: 'Set of atmospheric drone sounds for film and game soundtracks',
            createdAt: '2023-10-18T11:33:21Z'
        }
    ];
}