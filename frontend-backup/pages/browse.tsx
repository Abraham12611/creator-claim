import Head from 'next/head';
import Link from 'next/link';
import CertificateList from '../../frontend-backup/components/CertificateList';

const BrowsePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neon-bg text-neon-text px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Browse Certificates - CreatorClaim</title>
      </Head>

      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neon-primary">
          Browse Digital Assets
        </h1>
        <Link href="/"
          className="text-neon-secondary hover:underline"
        >
          &larr; Back Home
        </Link>
      </header>

      <main>
        <CertificateList />
      </main>

       <footer className="flex items-center justify-center w-full h-24 border-t border-neon-accent mt-12">
        <p>
          Secure. Transparent. Fair.
        </p>
      </footer>
    </div>
  );
};

export default BrowsePage;