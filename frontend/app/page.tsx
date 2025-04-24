import Link from 'next/link';

// Note: Removed Head import and component as metadata is handled in layout.tsx

export default function Home() {
  return (
    // The outer div now inherits background/text color from layout/globals.css
    // We just need to ensure flex layout and min-height for centering.
    <div className="flex flex-col items-center justify-center min-h-screen py-2">

      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-6">
          Welcome to <span className="text-neon-primary">CreatorClaim</span>
        </h1>

        <p className="mt-3 text-lg sm:text-2xl mb-8">
          Secure Digital Ownership & Real-Time Royalties
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 w-full max-w-4xl">
          <Link href="/browse"
            className="p-6 text-left border w-full sm:w-96 rounded-xl hover:text-neon-primary focus:text-neon-primary border-neon-accent hover:border-neon-primary transition-colors duration-150 ease-in-out"
          >
            <h3 className="text-xl sm:text-2xl font-bold">Browse Assets &rarr;</h3>
            <p className="mt-4 text-base sm:text-xl">
              Discover creative works with clear licensing.
            </p>
          </Link>

          {/* Placeholder: Register Work */}
          <div
             className="p-6 text-left border w-full sm:w-96 rounded-xl border-gray-600 text-gray-400 cursor-not-allowed"
          >
            <h3 className="text-xl sm:text-2xl font-bold">Register Your Work &rarr;</h3>
            <p className="mt-4 text-base sm:text-xl">
              Mint certificates and set up licensing (Coming Soon).
            </p>
          </div>

           {/* Placeholder: Creator Dashboard */}
           <div
             className="p-6 text-left border w-full sm:w-96 rounded-xl border-gray-600 text-gray-400 cursor-not-allowed"
          >
            <h3 className="text-xl sm:text-2xl font-bold">Creator Dashboard &rarr;</h3>
            <p className="mt-4 text-base sm:text-xl">
              View your earnings and manage assets (Coming Soon).
            </p>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center w-full h-24 border-t border-neon-accent mt-10">
        <p>
          Powered by Solana & You
        </p>
      </footer>
    </div>
  );
}
