import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0a2039] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="Pompano Beach Pointe Residences"
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs mb-6">
              Fully furnished apartments for extended stays, business travel &amp; vacations
              in Pompano Beach, Florida. Book direct and skip the fees.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/pompanobeachpointe" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#c9a84c] text-xs font-medium transition-colors tracking-wide uppercase">
                Facebook
              </a>
              <a href="https://www.instagram.com/pompanobeachpointe" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#c9a84c] text-xs font-medium transition-colors tracking-wide uppercase">
                Instagram
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-[0.2em] mb-5">Explore</h3>
            <ul className="space-y-3">
              {[
                { label: 'Browse All Units', href: '/units' },
                { label: 'Gallery',          href: '/gallery' },
                { label: 'My Bookings',      href: '/my-bookings' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/50 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-[0.2em] mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2.5 text-sm text-white/50">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#c9a84c]" />
                <span>
                  2250 SE 5th St &amp; 25 NE 19th Ave<br />
                  Pompano Beach, FL
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 shrink-0 text-[#c9a84c]" />
                <a href="tel:+19543209267" className="text-white/50 hover:text-white transition-colors">
                  (954) 320-9267
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm">
                <Mail className="w-4 h-4 shrink-0 text-[#c9a84c]" />
                <a href="mailto:info@StayPBPointe.com" className="text-white/50 hover:text-white transition-colors">
                  info@StayPBPointe.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/30 text-xs">
          <span>© {new Date().getFullYear()} Pompano Beach Pointe Residences. All rights reserved.</span>
          <span>Book direct · No platform fees · Pompano Beach, FL</span>
        </div>
      </div>
    </footer>
  );
}
