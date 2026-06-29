'use client';

import { useState, useCallback } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { useAuth, useUser, SignInButton } from '@clerk/nextjs';
import { api, Unit, AvailabilityResult } from '@/lib/api';
import { formatCurrency, toDateString } from '@/lib/utils';
import { differenceInDays, addDays, isBefore, startOfToday } from 'date-fns';
import { Loader2, CalendarDays, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  unit: Unit;
}

export default function BookingPanel({ unit }: Props) {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const disabledDays = [{ before: addDays(startOfToday(), 1) }];

  const blocked = availability?.blockedDates.map((d) => new Date(d)) ?? [];

  const nights = range?.from && range?.to ? differenceInDays(range.to, range.from) : 0;

  const handleRangeSelect = useCallback(async (r: DateRange | undefined) => {
    setRange(r);
    setAvailability(null);
    setError('');
    if (r?.from && r?.to) {
      setChecking(true);
      try {
        const result = await api.availability.check(unit.id, toDateString(r.from), toDateString(r.to));
        setAvailability(result);
      } catch {
        setError('Could not check availability. Please try again.');
      } finally {
        setChecking(false);
      }
    }
  }, [unit.id]);

  const handleBook = async () => {
    if (!range?.from || !range?.to || !availability?.available) return;
    setBooking(true);
    setError('');
    try {
      const token = await getToken();
      const b = await api.bookings.create(
        { unitId: unit.id, checkin: toDateString(range.from), checkout: toDateString(range.to), guests },
        token!,
      );
      const session = await api.payments.createSession(
        {
          bookingId: b.id,
          successUrl: `${window.location.origin}/booking-success?bookingId=${b.id}`,
          cancelUrl: `${window.location.origin}/units/${unit.slug}?cancelled=1`,
        },
        token!,
      );
      window.location.href = session.url;
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
      setBooking(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Price header */}
      <div className="bg-[#0f2a47] text-white px-6 py-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{formatCurrency(unit.pricePerNight)}</span>
          <span className="text-white/60 text-sm">/night</span>
        </div>
        <p className="text-white/50 text-xs mt-1">+ cleaning fee · + 12% service fee</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Calendar */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <CalendarDays className="w-3.5 h-3.5" /> Select Dates
          </label>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            disabled={[...disabledDays, ...blocked]}
            modifiers={{ blocked }}
            modifiersClassNames={{ blocked: 'line-through opacity-40' }}
            numberOfMonths={1}
            showOutsideDays={false}
          />
        </div>

        {/* Guests */}
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" /> Guests
          </label>
          <div className="relative">
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
            >
              {Array.from({ length: unit.maxGuests }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Checking spinner */}
        {checking && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking availability…
          </div>
        )}

        {/* Availability result */}
        {availability && !checking && (
          <div className={cn(
            'rounded-xl px-4 py-3 text-sm font-medium',
            availability.available
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          )}>
            {availability.available
              ? `✓ Available for ${nights} night${nights > 1 ? 's' : ''}!`
              : '✗ These dates are not available. Please choose different dates.'}
          </div>
        )}

        {/* Price breakdown */}
        {availability?.available && availability.priceSummary && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{formatCurrency(unit.pricePerNight)} × {nights} nights</span>
              <span>{formatCurrency(availability.priceSummary.basePrice)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Cleaning fee</span>
              <span>{formatCurrency(availability.priceSummary.cleaningFee)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Service fee (12%)</span>
              <span>{formatCurrency(availability.priceSummary.serviceFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0f2a47] pt-2 border-t border-gray-200 text-base">
              <span>Total</span>
              <span>{formatCurrency(availability.priceSummary.totalPrice)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* CTA */}
        {!isSignedIn ? (
          <SignInButton mode="modal">
            <button className="w-full bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold py-4 rounded-xl transition-colors text-base">
              Sign In to Book
            </button>
          </SignInButton>
        ) : (
          <button
            onClick={handleBook}
            disabled={!availability?.available || booking || nights === 0}
            className={cn(
              'w-full font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2',
              availability?.available && nights > 0
                ? 'bg-[#c9a84c] hover:bg-[#b8963e] text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {booking && <Loader2 className="w-4 h-4 animate-spin" />}
            {booking ? 'Redirecting to payment…' : nights === 0 ? 'Select dates to book' : 'Reserve Now'}
          </button>
        )}

        <p className="text-center text-xs text-gray-400">You won't be charged yet</p>
      </div>
    </div>
  );
}
