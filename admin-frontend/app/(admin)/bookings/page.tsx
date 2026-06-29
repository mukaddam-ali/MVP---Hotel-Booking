'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Booking } from '@/lib/api';
import { formatCurrency, formatDate, nightsBetween } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Loader2, Search, XCircle, RefreshCw } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function BookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function load() {
    const token = await getToken();
    if (!token) return;
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    const result = await api.bookings.list(token, params).catch(() => ({ data: [], total: 0, page: 1, lastPage: 1 }));
    setBookings(result.data);
    setLoading(false);
  }

  useEffect(() => { setLoading(true); load(); }, [statusFilter]);

  const filtered = search
    ? bookings.filter(
        (b) =>
          b.unit?.name.toLowerCase().includes(search.toLowerCase()) ||
          b.user?.email.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  async function handleCancel(id: string) {
    if (!confirm('Cancel this booking?')) return;
    setActionId(id);
    const token = await getToken();
    await api.bookings.cancel(id, token!).catch((e) => setError(e.message));
    await load();
    setActionId(null);
  }

  async function handleRefund(id: string) {
    if (!confirm('Issue a Stripe refund for this booking?')) return;
    setActionId(id);
    const token = await getToken();
    await api.bookings.refund(id, token!).catch((e) => setError(e.message));
    await load();
    setActionId(null);
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit or guest email…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
        >
          <option value="">All Statuses</option>
          {['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Unit</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Guest</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dates</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No bookings found.</td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-[#0f2a47]">{b.unit?.name ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500">{b.user?.email ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500">
                    {formatDate(b.checkin)} → {formatDate(b.checkout)}
                    <span className="ml-1 text-gray-400">({nightsBetween(b.checkin, b.checkout)}n)</span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">{formatCurrency(b.totalPrice)}</td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_BADGE[b.status])}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={actionId === b.id}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          {actionId === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                          Cancel
                        </button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleRefund(b.id)}
                          disabled={actionId === b.id}
                          className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700 disabled:opacity-40"
                        >
                          <RefreshCw className="w-3 h-3" /> Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
