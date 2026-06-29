import Link from 'next/link';
import { Waves, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0f2a47] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Waves className="w-6 h-6 text-[#c9a84c]" />
              <span className="font-bold text-lg">
                Pompano Beach <span className="text-[#c9a84c]">Pointe</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Your home away from home in Pompano Beach, Florida. Book directly and save on fees.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-[#c9a84c] mb-4 text-sm uppercase tracking-wider">Explore</h3>
            <ul className="space-y-2">
              {[
                { label: 'Browse All Units', href: '/units' },
                { label: 'Gallery', href: '/gallery' },
                { label: 'My Bookings', href: '/my-bookings' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/60 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-[#c9a84c] mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#c9a84c]" />
                Pompano Beach, Florida
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="w-4 h-4 text-[#c9a84c]" />
                <a href="tel:+1-555-000-0000" className="hover:text-white transition-colors">
                  (555) 000-0000
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="w-4 h-4 text-[#c9a84c]" />
                <a href="mailto:hello@pbpointe.com" className="hover:text-white transition-colors">
                  hello@pbpointe.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 text-center text-white/40 text-xs">
          © {new Date().getFullYear()} Pompano Beach Pointe Residences. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
