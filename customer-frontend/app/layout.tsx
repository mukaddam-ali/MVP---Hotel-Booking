import type { Metadata, Viewport } from 'next';
import { Playfair_Display } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import UserSync from '@/components/auth/UserSync';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pompano Beach Pointe Residences — Direct Booking',
  description: 'Book your stay directly at Pompano Beach Pointe Residences. Studios, one-bedroom and two-bedroom apartments steps from the beach in Pompano Beach, Florida.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`h-full ${playfair.variable}`}>
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <UserSync />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
