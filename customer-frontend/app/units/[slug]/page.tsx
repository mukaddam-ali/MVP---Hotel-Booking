import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Users, BedDouble, Bath, Maximize2, Star, ChevronLeft, ShieldCheck } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/utils';
import Link from 'next/link';
import BookingPanel from '@/components/booking/BookingPanel';
import ReviewsSection from '@/components/reviews/ReviewsSection';

export const revalidate = 60;

export async function generateStaticParams() {
  const units = await api.units.list().catch(() => []);
  return units.map((u) => ({ slug: u.slug }));
}

export default async function UnitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const unit = await api.units.get(slug).catch(() => null);

  if (!unit) notFound();

  const unitReviews = await api.reviews.list(unit.id).catch(() => []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/units" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0f2a47] transition-colors">
          <ChevronLeft className="w-4 h-4" /> All Units
        </Link>
      </div>

      {/* Photo gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {unit.images.length === 0 ? (
          <div className="w-full h-80 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-300 text-6xl">🏖️</div>
        ) : unit.images.length === 1 ? (
          <div className="w-full h-80 rounded-2xl overflow-hidden">
            <img src={cloudinaryUrl(unit.images[0], 1200)} alt={unit.name} fetchPriority="high" decoding="sync" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-80">
            <div className="col-span-2 row-span-2 rounded-l-2xl overflow-hidden">
              <img src={cloudinaryUrl(unit.images[0], 1200)} alt={unit.name} fetchPriority="high" decoding="sync" className="w-full h-full object-cover" />
            </div>
            {unit.images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className={`overflow-hidden ${i === 1 ? 'rounded-tr-2xl' : ''} ${i === 3 ? 'rounded-br-2xl' : ''}`}
              >
                <img src={cloudinaryUrl(img, 600)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — unit info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title */}
            <div>
              <p className="text-sm font-semibold text-[#c9a84c] uppercase tracking-wider mb-1">{unit.type}</p>
              <h1 className="text-3xl font-bold text-[#0f2a47] mb-3">{unit.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><BedDouble className="w-4 h-4" /> {unit.bedrooms} bed</span>
                <span className="flex items-center gap-1.5"><Bath className="w-4 h-4" /> {unit.bathrooms} bath</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Up to {unit.maxGuests} guests</span>
                {unit.sqft && <span className="flex items-center gap-1.5"><Maximize2 className="w-4 h-4" /> {unit.sqft} sqft</span>}
                {unit.reviewCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-[#c9a84c] text-[#c9a84c]" />
                    {unit.averageRating} · {unit.reviewCount} review{unit.reviewCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {unit.description.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#0f2a47] mb-3">About this unit</h2>
                <div className="space-y-3">
                  {unit.description.map((para, i) => (
                    <p key={i} className="text-gray-600 leading-relaxed">{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {unit.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#0f2a47] mb-4">What's included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {unit.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2.5">
                      <span className="text-[#c9a84c]">✓</span> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing breakdown */}
            <div className="bg-[#faf8f4] rounded-2xl p-6">
              <h2 className="text-xl font-bold text-[#0f2a47] mb-4">Pricing</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Nightly rate</span>
                  <span className="font-semibold">{formatCurrency(unit.pricePerNight)}/night</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cleaning fee</span>
                  <span className="font-semibold">{formatCurrency(unit.cleaningFee)}/stay</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service fee</span>
                  <span className="font-semibold">12% of base rate</span>
                </div>
              </div>
            </div>

            {/* Cancellation policy */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#0f2a47]" />
                <h2 className="text-xl font-bold text-[#0f2a47]">Cancellation Policy</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                Free cancellation up to <span className="font-semibold text-[#0f2a47]">{unit.cancellationHours} hours</span> before check-in.
                After that, cancellation is not available — please contact the property directly for assistance.
              </p>
            </div>

            {/* Reviews */}
            <ReviewsSection unitId={unit.id} initialReviews={unitReviews} />
          </div>

          {/* Right — booking panel (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <BookingPanel unit={unit} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
