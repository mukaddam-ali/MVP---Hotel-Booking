import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { cloudinaryUrl } from '@/lib/utils';
import {
  Star, Shield, CreditCard, CalendarCheck,
  Wifi, Car, Home, PawPrint, Waves, UtensilsCrossed,
  Phone, ChevronDown, MapPin,
} from 'lucide-react';
import AnimateIn from '@/components/ui/AnimateIn';

export const revalidate = 60;

export default async function HomePage() {
  const [units, testimonials] = await Promise.all([
    api.units.list().catch(() => []),
    api.testimonials.list().catch(() => []),
  ]);

  const typeMap = new Map<string, typeof units[0]>();
  for (const u of units) {
    if (!typeMap.has(u.type)) typeMap.set(u.type, u);
  }
  const featured = Array.from(typeMap.values()).slice(0, 3);
  const priceFrom = units.length ? Math.min(...units.map((u) => u.pricePerNight)) : 0;
  const heroImg = units[0]?.images[0] ? cloudinaryUrl(units[0].images[0], 1920) : null;

  return (
    <>
      {/* ── HERO — pure CSS animations on page load ──────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[92vh] overflow-hidden">
        {heroImg && (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
            decoding="sync"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2a47]/75 via-[#0f2a47]/70 to-[#0f2a47]/85" />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto py-20">
          <p className="hero-anim anim-d1 text-[#c9a84c] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-6">
            Pompano Beach · Florida
          </p>
          <h1 className="hero-anim anim-d2 font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
            Your South Florida<br />
            <span className="text-[#c9a84c]">Home Away</span> From Home
          </h1>
          <p className="hero-anim anim-d3 text-white/70 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            {units.length > 0 ? units.length : 17} fully furnished apartments steps from the beach.
            Studios, 1-bedroom &amp; 2-bedroom — book direct,{' '}
            {priceFrom > 0 && <>from <strong className="text-white">{formatCurrency(priceFrom)}/night</strong>, </>}
            no platform fees.
          </p>
          <div className="hero-anim anim-d4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/units"
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-8 py-4 rounded-xl text-base transition-colors shadow-lg"
            >
              Browse All Units
            </Link>
            <a
              href="tel:+19543209267"
              className="flex items-center justify-center gap-2 border border-white/40 hover:border-white/80 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              <Phone className="w-4 h-4" />
              (954) 320-9267
            </a>
          </div>
        </div>

        <div className="hero-anim anim-d5 absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { value: `${units.length || 17}+`, label: 'Units Available' },
              { value: '2',   label: 'Locations' },
              { value: '0%',  label: 'Platform Fees' },
              { value: '✓',   label: 'Pet Friendly' },
            ].map(({ value, label }, i) => (
              <AnimateIn key={label} direction="up" delay={i * 80}>
                <div className="text-center py-6 px-4">
                  <div className="text-2xl font-bold text-[#0f2a47]">{value}</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">{label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED UNITS ───────────────────────────────────── */}
      <section className="py-24 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn direction="up" className="text-center mb-16">
            <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Our Properties</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#0f2a47]">Find Your Perfect Stay</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
              From cozy efficiency studios to spacious two-bedroom suites — every unit is fully
              furnished and ready the moment you arrive.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featured.map((unit, i) => (
              <AnimateIn key={unit.id} direction="up" delay={i * 120}>
                <Link
                  href={`/units/${unit.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
                >
                  <div className="aspect-4/3 bg-gray-100 overflow-hidden relative">
                    {unit.images[0] ? (
                      <img
                        src={cloudinaryUrl(unit.images[0], 600)}
                        alt={unit.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200 text-6xl">🏖️</div>
                    )}
                    <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#0f2a47] text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
                      {unit.type}
                    </span>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-bold text-[#0f2a47] text-lg mb-1">{unit.name}</h3>
                    <p className="text-sm text-gray-400 mb-5">
                      {unit.bedrooms} bed · {unit.bathrooms} bath · up to {unit.maxGuests} guests
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xl font-bold text-[#0f2a47]">{formatCurrency(unit.pricePerNight)}</span>
                        <span className="text-sm text-gray-400"> /night</span>
                      </div>
                      <span className="text-sm font-semibold text-[#c9a84c]">View &amp; Book →</span>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>

          <AnimateIn direction="up" delay={200} className="text-center mt-14">
            <Link
              href="/units"
              className="inline-flex items-center gap-2 border-2 border-[#0f2a47] text-[#0f2a47] hover:bg-[#0f2a47] hover:text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              View All {units.length || 17} Units
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* ── AMENITIES ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn direction="up" className="text-center mb-16">
            <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">What's Included</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#0f2a47]">Everything You Need</h2>
            <p className="text-gray-500 mt-4">Every unit comes fully set up — just bring your bags.</p>
          </AnimateIn>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
            {[
              { Icon: Wifi,            label: 'High-Speed WiFi',  desc: 'Fast internet in every unit' },
              { Icon: Car,             label: 'Free Parking',     desc: 'On-site parking available' },
              { Icon: Home,            label: 'Fully Furnished',  desc: 'Move-in ready apartments' },
              { Icon: PawPrint,        label: 'Pet Friendly',     desc: 'Your pets are family too' },
              { Icon: Waves,           label: 'Pool Access',      desc: 'Relax poolside any time' },
              { Icon: UtensilsCrossed, label: 'Full Kitchen',     desc: 'Cook your own meals' },
            ].map(({ Icon, label, desc }, i) => (
              <AnimateIn key={label} direction="up" delay={i * 70}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#0f2a47]/6 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#0f2a47]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f2a47] text-sm leading-snug">{label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOCATION ─────────────────────────────────────────── */}
      <section className="py-24 bg-[#0f2a47] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
            <AnimateIn direction="left">
              <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-4">Location</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Steps From It All
              </h2>
              <p className="text-white/65 leading-relaxed mb-4">
                Situated in the heart of Pompano Beach — Florida's Warmest Welcome — our two properties
                put you minutes from golden beaches, world-class dining, shopping, and water sports.
              </p>
              <p className="text-white/65 leading-relaxed">
                Perfect for extended stays, business travel, family vacations, or a simple escape.
                No hotel hallways, no noise — just your own fully furnished home.
              </p>
              <Link
                href="/units"
                className="inline-flex items-center gap-2 mt-8 bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm"
              >
                See Available Units
              </Link>
            </AnimateIn>

            <AnimateIn direction="right" delay={100}>
              <div className="space-y-5">
                {[
                  { label: 'Location 1', value: '2250 SE 5th Street, Pompano Beach, FL 33062' },
                  { label: 'Location 2', value: '25 NE 19th Avenue, Pompano Beach, FL 33060' },
                  { label: 'Beach',      value: 'Minutes from the Atlantic coast' },
                  { label: 'Airport',    value: '~25 min to Fort Lauderdale-Hollywood Intl' },
                  { label: 'Dining',     value: 'Restaurants, cafés & bars within walking distance' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 items-start border-b border-white/8 pb-5 last:border-0 last:pb-0">
                    <MapPin className="w-4 h-4 text-[#c9a84c] mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[#c9a84c] text-xs font-semibold uppercase tracking-widest">{label}</span>
                      <p className="text-white/65 text-sm mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* ── WHY BOOK DIRECT ──────────────────────────────────── */}
      <section className="py-24 bg-[#fafaf9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateIn direction="up" className="text-center mb-16">
            <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Why Direct?</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#0f2a47]">Skip the Middleman</h2>
            <p className="text-gray-500 mt-4">
              Airbnb and VRBO add 12–15% on top. Here, you pay us directly — nothing extra.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              { Icon: CreditCard,    title: 'No Service Fees',       desc: 'What you see is what you pay. Zero hidden platform charges ever.' },
              { Icon: Shield,        title: 'Secure Payments',        desc: 'Powered by Stripe. Your card data never touches our servers.' },
              { Icon: CalendarCheck, title: 'Instant Confirmation',   desc: 'Book and receive your confirmation immediately. No waiting.' },
            ].map(({ Icon, title, desc }, i) => (
              <AnimateIn key={title} direction="up" delay={i * 120}>
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#0f2a47] rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-6 h-6 text-[#c9a84c]" />
                  </div>
                  <h3 className="font-bold text-[#0f2a47] text-lg mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimateIn direction="up" className="text-center mb-16">
              <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Reviews</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#0f2a47]">What Our Guests Say</h2>
            </AnimateIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t, i) => (
                <AnimateIn key={t.id} direction="up" delay={i * 100}>
                  <div className="bg-[#fafaf9] rounded-2xl p-8 flex flex-col h-full">
                    {t.rating && (
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: t.rating }).map((_, j) => (
                          <Star key={j} className="w-4 h-4 fill-[#c9a84c] text-[#c9a84c]" />
                        ))}
                      </div>
                    )}
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">"{t.content}"</p>
                    <div className="border-t border-gray-100 pt-5">
                      <p className="font-semibold text-[#0f2a47] text-sm">{t.guestName}</p>
                      {t.location && <p className="text-gray-400 text-xs mt-0.5">{t.location}</p>}
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="py-24 bg-[#0f2a47]">
        <AnimateIn direction="up" className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Ready for Your{' '}
            <span className="text-[#c9a84c]">Pompano Beach</span> Getaway?
          </h2>
          <p className="text-white/60 mb-10 text-lg leading-relaxed">
            Book direct, pay less, stay more.<br className="hidden sm:block" />
            No platform fees — ever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/units"
              className="bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-10 py-4 rounded-xl text-base transition-colors"
            >
              Check Availability
            </Link>
            <a
              href="tel:+19543209267"
              className="flex items-center justify-center gap-2 border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
            >
              <Phone className="w-4 h-4" />
              (954) 320-9267
            </a>
          </div>
        </AnimateIn>
      </section>
    </>
  );
}
