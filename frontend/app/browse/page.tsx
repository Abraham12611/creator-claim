'use client'; // Likely needs client-side fetching

import React, { useState, useCallback } from 'react';
import NavigationBar from '../../components/NavigationBar'; // Adjust path if needed
import CertificateList from '../../components/CertificateList'; // Import existing component

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min?: number; max?: number }>({});
  const [searchInput, setSearchInput] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Function to handle search submission
  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchTerm(searchInput);
  }, [searchInput]);

  // Debounce search input for better UX
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Function to handle price range changes
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;
    setPriceRange(prev => ({ ...prev, [type]: value }));
  }, []);

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSearchInput('');
    setPriceRange({});
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <NavigationBar />

      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-pure-white">Browse Certificates</h1>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="flex-1 md:w-64">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search by title..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  className="w-full py-2 px-4 pl-10 bg-midnight-navy border border-neon-lilac/30 rounded-lg focus:border-electric-cyan focus:outline-none text-pure-white"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-neon-text/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 text-neon-text hover:text-electric-cyan transition-colors text-sm py-1 px-2"
                >
                  Search
                </button>
              </div>
            </form>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 py-2 px-4 bg-midnight-navy/80 border border-neon-lilac/30 hover:border-electric-cyan rounded-lg text-neon-text hover:text-electric-cyan transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-8 p-4 border border-neon-lilac/30 rounded-lg bg-midnight-navy/40">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-neon-text mb-2">Price Range (USDC)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    min="0"
                    step="0.01"
                    value={priceRange.min || ''}
                    onChange={e => handlePriceChange(e, 'min')}
                    className="w-full py-2 px-3 bg-midnight-navy border border-neon-lilac/30 rounded-lg focus:border-electric-cyan focus:outline-none text-pure-white"
                  />
                  <span className="text-neon-text">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    min="0"
                    step="0.01"
                    value={priceRange.max || ''}
                    onChange={e => handlePriceChange(e, 'max')}
                    className="w-full py-2 px-3 bg-midnight-navy border border-neon-lilac/30 rounded-lg focus:border-electric-cyan focus:outline-none text-pure-white"
                  />
                </div>
              </div>

              {/* Additional filters can be added here */}

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="py-2 px-4 border border-neon-lilac/30 hover:border-electric-cyan rounded-lg text-neon-text hover:text-electric-cyan transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Using the enhanced CertificateList component with search/filter props */}
        <CertificateList
          searchTerm={searchTerm}
          minPrice={priceRange.min}
          maxPrice={priceRange.max}
        />
      </main>
    </div>
  );
}