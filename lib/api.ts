// Define the shape of a certificate object
export interface Certificate {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // URL to the visual asset
  metadataUrl: string; // URL to the Arweave metadata
  creator: string; // Wallet address of the creator
  priceUSDC: number; // Price in USDC for a standard licence
  licenceTemplate: 'standard' | 'exclusive' | 'editorial'; // Example templates
  tags?: string[];
}

// Mock certificate data
const mockCertificates: Certificate[] = [
  {
    id: '1',
    title: 'Abstract Waves',
    description: 'A colorful abstract generative art piece.',
    imageUrl: '/placeholder-image.png', // Replace with actual image path if available
    metadataUrl: 'ar://mock-meta-1',
    creator: '艺术家艺术家艺术家艺术家艺术家艺术家艺术家艺术家艺术家艺术家艺术家', // Example short address
    priceUSDC: 50,
    licenceTemplate: 'standard',
    tags: ['abstract', 'generative', 'colorful'],
  },
  {
    id: '2',
    title: 'Neon Cityscape',
    description: 'A cyberpunk cityscape photograph.',
    imageUrl: '/placeholder-image.png',
    metadataUrl: 'ar://mock-meta-2',
    creator: '摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师',
    priceUSDC: 150,
    licenceTemplate: 'editorial',
    tags: ['photography', 'cityscape', 'neon', 'cyberpunk'],
  },
  {
    id: '3',
    title: 'Lo-Fi Beat Loop',
    description: 'A chill, royalty-free beat loop.',
    imageUrl: '/placeholder-audio.png', // Placeholder for audio
    metadataUrl: 'ar://mock-meta-3',
    creator: '音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家',
    priceUSDC: 25,
    licenceTemplate: 'standard',
    tags: ['music', 'loop', 'lo-fi', 'beat'],
  },
   {
    id: '4',
    title: 'Mountain Sunrise',
    description: 'Serene landscape photo.',
    imageUrl: '/placeholder-image.png',
    metadataUrl: 'ar://mock-meta-4',
    creator: '摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师摄影师',
    priceUSDC: 75,
    licenceTemplate: 'standard',
    tags: ['photography', 'landscape', 'nature', 'sunrise'],
  },
   {
    id: '5',
    title: 'Minimalist Logo Pack',
    description: 'Set of vector logos.',
    imageUrl: '/placeholder-image.png',
    metadataUrl: 'ar://mock-meta-5',
    creator: '设计师设计师设计师设计师设计师设计师设计师设计师设计师设计师设计师',
    priceUSDC: 200,
    licenceTemplate: 'exclusive',
    tags: ['design', 'logo', 'vector', 'minimalist'],
  },
   {
    id: '6',
    title: 'Ambient Soundscape',
    description: 'Atmospheric background music.',
    imageUrl: '/placeholder-audio.png',
    metadataUrl: 'ar://mock-meta-6',
    creator: '音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家音乐家',
    priceUSDC: 40,
    licenceTemplate: 'standard',
    tags: ['music', 'ambient', 'soundscape'],
  },
];


// Fetch a list of certificates (mock implementation)
export async function fetchCertificates(
    filters: { searchTerm?: string; priceMin?: number; priceMax?: number } = {}
): Promise<Certificate[]> {
  console.log("Fetching certificates with filters:", filters);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate filtering
  let results = mockCertificates;

  if (filters.searchTerm) {
    const lowerSearch = filters.searchTerm.toLowerCase();
    results = results.filter(cert =>
      cert.title.toLowerCase().includes(lowerSearch) ||
      cert.description.toLowerCase().includes(lowerSearch) ||
      cert.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
    );
  }

  if (filters.priceMin !== undefined) {
    results = results.filter(cert => cert.priceUSDC >= filters.priceMin!);
  }

  if (filters.priceMax !== undefined) {
     // Add a check for 0 or empty string, treat as no upper limit
     if (filters.priceMax > 0) {
        results = results.filter(cert => cert.priceUSDC <= filters.priceMax!);
     }
  }


  console.log("Filtered results:", results.length);
  // In a real app, this would fetch from your API endpoint
  // e.g., const res = await fetch('/api/certificates?search=...');
  return results;
}

// Fetch details for a single certificate by ID (mock implementation)
export async function fetchCertificateById(id: string): Promise<Certificate | null> {
  console.log("Fetching certificate by ID:", id);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const certificate = mockCertificates.find(cert => cert.id === id) || null;
  console.log("Found certificate:", certificate);
  // In a real app, fetch from e.g., /api/certificates/[id]
  return certificate;
}