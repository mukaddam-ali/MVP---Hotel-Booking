import Link from 'next/link';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Star, Shield, CreditCard, CalendarCheck } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';

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
  const featured = Array.from(typeMap.values()).slice(0, 4);
  const priceFrom = units.length ? Math.min(...units.map((u) => u.pricePerNight)) : 100;

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-140 flex items-center bg-[#0f2a47] overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,#c9a84c_0%,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white w-full">
          <div className="inline-flex items-center gap-2 bg-[#c9a84c]/20 border border-[#c9a84c]/40 rounded-full px-4 py-1.5 text-[#c9a84c] text-sm font-medium mb-6">
            <MapPin className="w-3.5 h-3.5" /> Pompano Beach, Florida
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Book Direct &amp; Save<br />
            <span className="text-[#c9a84c]">No Platform Fees</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
            17 fully-furnished apartments steps from the beach. Skip Airbnb and VRBO —{' '}
            book directly with us from <strong className="text-white">{formatCurrency(priceFrom)}/night</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/units" className="bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg">
              Browse All Units
            </Link>
            <a href="#how-it-works" className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Why Book Direct */}
      <section className="bg-[#faf8f4] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: CreditCard, title: 'No Service Fees', desc: "Airbnb charges 12–15% on top. We don't." },
              { icon: Shield, title: 'Secure Payments', desc: 'Powered by Stripe. Your card data never touches our servers.' },
              { icon: CalendarCheck, title: 'Instant Confirmation', desc: 'Book and receive your confirmation immediately.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-[#0f2a47] rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#c9a84c]" />
                </div>
                <h3 className="font-bold text-[#0f2a47] text-lg">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Unit Types */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0f2a47] mb-3">Choose Your Space</h2>
            <p className="text-gray-500">From cozy studios to spacious two-bedrooms — all fully furnished.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((unit) => (
              <Link key={unit.id} href={`/units/${unit.slug}`} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="aspect-4/3 bg-gray-100 overflow-hidden">
                  {unit.images[0] ? (
                    <img src={cloudinaryUrl(unit.images[0], 600)} alt={unit.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🏖️</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">{unit.type}</p>
                  <h3 className="font-bold text-[#0f2a47] mb-2">{unit.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Up to {unit.maxGuests} guests</span>
                    <span className="font-bold text-[#0f2a47]">
                      {formatCurrency(unit.pricePerNight)}
                      <span className="text-xs font-normal text-gray-400">/night</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/units" className="inline-block border-2 border-[#0f2a47] text-[#0f2a47] hover:bg-[#0f2a47] hover:text-white font-bold px-8 py-3 rounded-xl transition-colors">
              View All {units.length} Units →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[#0f2a47] py-16 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Book in 3 Simple Steps</h2>
            <p className="text-white/60">No account required to browse. Sign up only when you're ready to book.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Browse & Pick Dates', desc: 'Explore all 17 units, check real-time availability, and see your total price upfront.' },
              { step: '02', title: 'Create a Free Account', desc: 'Sign up with email or Google — takes 30 seconds. No credit card required to register.' },
              { step: '03', title: 'Pay & Confirm', desc: 'Complete payment via Stripe. Your booking is confirmed instantly.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#c9a84c] flex items-center justify-center text-[#c9a84c] font-bold text-lg">
                  {step}
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/units" className="bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors">
              Start Browsing
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-[#faf8f4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0f2a47] mb-3">What Our Guests Say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.slice(0, 3).map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  {t.rating && (
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#c9a84c] text-[#c9a84c]" />
                      ))}
                    </div>
                  )}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.content}"</p>
                  <div>
                    <p className="font-semibold text-[#0f2a47] text-sm">{t.guestName}</p>
                    {t.location && <p className="text-gray-400 text-xs">{t.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#c9a84c] py-14">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Pompano Beach Getaway?</h2>
          <p className="text-white/80 mb-8 text-lg">Skip the middleman. Book direct, pay less, stay more.</p>
          <Link href="/units" className="bg-white text-[#0f2a47] hover:bg-gray-100 font-bold px-10 py-4 rounded-xl text-lg transition-colors inline-block">
            Check Availability
          </Link>
        </div>
      </section>
    </>
  );
}
