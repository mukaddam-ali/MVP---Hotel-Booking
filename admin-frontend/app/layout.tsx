import type { Metadata } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import UserSync from '@/components/UserSync';

export const metadata: Metadata = {
  title: 'Admin — Pompano Beach Pointe',
  description: 'Property management portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
          <UserSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
