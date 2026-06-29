'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Unit } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search, Users, Star, BedDouble, SlidersHorizontal } from 'lucide-react';
import { cn, cloudinaryUrl } from '@/lib/utils';

const TYPES = ['All', 'Efficiency', 'Studio', 'Studio Loft', 'One Bedroom', 'Two Bedroom', 'Cottage / One Bedroom'];

export default function UnitsContent({ initialUnits }: { initialUnits: Unit[] }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const [guestFilter, setGuestFilter] = useState('');

  const units = useMemo(() => {
    return initialUnits.filter((u) => {
      if (typeFilter !== 'All' && u.type !== typeFilter) return false;
      if (guestFilter && u.maxGuests < Number(guestFilter)) return false;
      return true;
    });
  }, [initialUnits, typeFilter, guestFilter]);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Page header */}
      <div className="bg-[#0f2a47] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#c9a84c] text-xs font-semibold tracking-[0.3em] uppercase mb-3">Pompano Beach, FL</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-2">All Units</h1>
          <p className="text-white/50 text-base mt-2">
            {initialUnits.length} fully-furnished apartments across two Pompano Beach locations
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Type pills */}
            <div className="flex-1 min-w-0">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Unit Type
              </label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border',
                      typeFilter === t
                        ? 'bg-[#0f2a47] text-white border-[#0f2a47]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-[#0f2a47] hover:text-[#0f2a47]'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest count */}
            <div className="min-w-36 shrink-0">
              <label htmlFor="guests-filter" className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                <Users className="w-3.5 h-3.5" /> Guests
              </label>
              <select
                id="guests-filter"
                value={guestFilter}
                onChange={(e) => setGuestFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0f2a47] bg-white"
              >
                <option value="">Any size</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>{n}+ guests</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Result count */}
        <p className="text-sm text-gray-400 mb-6 font-medium">
          {units.length} unit{units.length !== 1 ? 's' : ''} found
        </p>

        {/* Grid */}
        {units.length === 0 ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-lg">No units match your filters.</p>
            <button
              type="button"
              onClick={() => { setTypeFilter('All'); setGuestFilter(''); }}
              className="mt-4 text-[#0f2a47] text-sm font-semibold underline underline-offset-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {units.map((unit, i) => (
              <UnitCard key={unit.id} unit={unit} priority={i === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UnitCard({ unit, priority }: { unit: Unit; priority?: boolean }) {
  return (
    <Link
      href={`/units/${unit.slug}`}
      className="group rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <div className="aspect-4/3 bg-gray-100 overflow-hidden relative">
        {unit.images[0] ? (
          <img
            src={cloudinaryUrl(unit.images[0], 600)}
            alt={unit.name}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">🏖️</div>
        )}
        {/* Type badge */}
        <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#0f2a47] text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
          {unit.type}
        </span>
        {/* Unavailable overlay */}
        {unit.status !== 'AVAILABLE' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 font-semibold px-4 py-2 rounded-full text-sm">
              {unit.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[#0f2a47] text-lg mb-1 leading-snug">{unit.name}</h3>

        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {unit.bedrooms} bed</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {unit.maxGuests} guests</span>
          {unit.reviewCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#c9a84c] text-[#c9a84c]" />
                {unit.averageRating}
              </span>
            </>
          )}
        </div>

        {unit.description[0] && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1 leading-relaxed">{unit.description[0]}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div>
            <span className="text-xl font-bold text-[#0f2a47]">{formatCurrency(unit.pricePerNight)}</span>
            <span className="text-sm text-gray-400"> /night</span>
          </div>
          <span className="bg-[#c9a84c] group-hover:bg-[#b8963e] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            View &amp; Book
          </span>
        </div>
      </div>
    </Link>
  );
}
