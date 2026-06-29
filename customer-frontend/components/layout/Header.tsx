'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { Menu, X, Waves } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Our Units', href: '/units' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'My Bookings', href: '/my-bookings' },
];

export default function Header() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-[#0f2a47] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Waves className="w-6 h-6 text-[#c9a84c]" />
            <span className="font-bold text-lg leading-tight">
              Pompano Beach <span className="text-[#c9a84c]">Pointe</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[#c9a84c]',
                  pathname === item.href ? 'text-[#c9a84c]' : 'text-white/80'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Auth — desktop */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/units"
                  className="bg-[#c9a84c] hover:bg-[#b8963e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Book Now
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignInButton mode="modal">
                  <button className="bg-[#c9a84c] hover:bg-[#b8963e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    Book Now
                  </button>
                </SignInButton>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="md:hidden p-3 -mr-1 rounded-lg active:bg-white/20 cursor-pointer select-none"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown — fixed so iOS Safari sticky bug doesn't swallow taps */}
      {open && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-[#0f2a47] border-t border-white/10 shadow-xl z-50">
          <div className="px-4 py-3 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center text-base font-medium py-3 px-2 rounded-lg transition-colors',
                  pathname === item.href
                    ? 'text-[#c9a84c] bg-white/5'
                    : 'text-white/80 hover:text-[#c9a84c] hover:bg-white/5'
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 border-t border-white/10 flex items-center gap-4 px-2">
              {isSignedIn ? (
                <>
                  <UserButton />
                  <Link
                    href="/units"
                    className="bg-[#c9a84c] hover:bg-[#b8963e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Book Now
                  </Link>
                </>
              ) : (
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-white/80">Sign In</button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop — closes menu when tapping outside on mobile */}
      {open && (
        <div
          className="md:hidden fixed inset-0 top-16 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </header>
  );
}
