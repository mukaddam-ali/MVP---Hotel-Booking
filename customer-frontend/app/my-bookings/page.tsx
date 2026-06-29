'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { api, Booking } from '@/lib/api';
import { formatCurrency, formatDate, nightsBetween } from '@/lib/utils';
import { CalendarDays, Loader2, ChevronRight, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-50 text-gray-500 border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function MyBookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const result = await api.bookings.mine(token).catch(() => ({ data: [], total: 0, page: 1, lastPage: 1 }));
      setBookings(result.data);
      setLoading(false);
    })();
  }, [getToken]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    setError('');
    try {
      const token = await getToken();
      await api.bookings.cancel(id, token!);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (e: any) {
      setError(e.message ?? 'Could not cancel booking.');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0f2a47] text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-1">My Bookings</h1>
          <p className="text-white/60">Your booking history at Pompano Beach Pointe</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f2a47]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No bookings yet</h2>
            <p className="text-gray-400 mb-6">When you book a unit it will appear here.</p>
            <Link href="/units" className="bg-[#c9a84c] hover:bg-[#b8963e] text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Browse Units
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const nights = nightsBetween(b.checkin, b.checkout);
              const canCancel = b.status === 'CONFIRMED' || b.status === 'PENDING';
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {/* Unit image */}
                    {b.unit?.images?.[0] && (
                      <div className="sm:w-40 h-36 sm:h-auto shrink-0 overflow-hidden">
                        <img src={b.unit.images[0]} alt={b.unit.name} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-[#0f2a47] text-lg">{b.unit?.name ?? 'Unit'}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(b.checkin)} → {formatDate(b.checkout)}
                            <span className="text-gray-300">·</span>
                            {nights} night{nights > 1 ? 's' : ''}
                          </div>
                        </div>
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_STYLES[b.status])}>
                          {b.status}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total paid</p>
                          <p className="font-bold text-[#0f2a47] text-lg">{formatCurrency(b.totalPrice)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              {cancelling === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              Cancel
                            </button>
                          )}
                          {b.unit?.slug && (
                            <Link href={`/units/${b.unit.slug}`} className="flex items-center gap-1 text-sm text-[#0f2a47] hover:text-[#c9a84c] transition-colors font-medium">
                              View unit <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
