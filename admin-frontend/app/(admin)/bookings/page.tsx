'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Booking } from '@/lib/api';
import { formatCurrency, formatDate, nightsBetween } from '@/lib/utils';
import { cn } from '@/lib/utils';
import React from 'react';
import {
  Loader2, Search, XCircle, RefreshCw,
  ChevronDown, ChevronUp, User, Building2,
  CreditCard, Clock,
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
};

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '—'}</span>
    </div>
  );
}

export default function BookingsPage() {
  const { getToken } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
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
    ? bookings.filter((b) =>
        b.unit?.name.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.email.toLowerCase().includes(search.toLowerCase()) ||
        b.user?.name.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      )
    : bookings;

  async function handleCancel(id: string) {
    if (!confirm('Cancel this booking? Blocked dates will be released.')) return;
    setActionId(id); setError('');
    const token = await getToken();
    await api.bookings.adminCancel(id, token!).catch((e) => setError(e.message));
    await load(); setActionId(null);
  }

  async function handleRefund(id: string) {
    if (!confirm('Issue a Stripe refund for this booking?')) return;
    setActionId(id);
    const token = await getToken();
    await api.bookings.refund(id, token!).catch((e) => setError(e.message));
    await load(); setActionId(null);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, unit or booking ID…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]">
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
                {['Unit', 'Guest', 'Check-in → Out', 'Total', 'Status', 'Booked At', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No bookings found.</td></tr>
              ) : filtered.map((b) => {
                const nights = nightsBetween(b.checkin, b.checkout);
                const isOpen = expanded === b.id;
                const statusLabel = b.status === 'CANCELLED' && b.cancelledBy
                  ? `Cancelled by ${b.cancelledBy === 'ADMIN' ? 'Admin' : 'Guest'}`
                  : b.status;

                return (
                  <React.Fragment key={b.id}>
                    {/* ── Summary row ── */}
                    <tr
                      onClick={() => toggleExpand(b.id)}
                      className={cn('border-b border-gray-50 cursor-pointer transition-colors',
                        isOpen ? 'bg-[#0f2a47]/5' : 'hover:bg-gray-50'
                      )}>
                      <td className="px-5 py-4 font-medium text-[#0f2a47]">{b.unit?.name ?? '—'}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{b.payment?.billingName ?? b.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{b.payment?.billingEmail ?? b.user?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(b.checkin)} → {formatDate(b.checkout)}
                        <span className="ml-1 text-gray-400 text-xs">({nights}n)</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-800">{formatCurrency(b.totalPrice)}</td>
                      <td className="px-5 py-4">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_BADGE[b.status])}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{fmtDateTime(b.createdAt)}</td>
                      <td className="px-5 py-4 text-gray-400">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </td>
                    </tr>

                    {/* ── Expanded detail panel ── */}
                    {isOpen && (
                      <tr className="bg-[#0f2a47]/5 border-b border-gray-100">
                        <td colSpan={7} className="px-6 py-5">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Guest */}
                            <div className="space-y-2.5">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0f2a47] uppercase tracking-wider mb-3">
                                <User className="w-3.5 h-3.5" /> Guest Information
                              </p>
                              <DetailRow label="Name (Stripe)" value={b.payment?.billingName ?? <span className="text-gray-400 italic">Not paid yet</span>} />
                              <DetailRow label="Email (Stripe)" value={b.payment?.billingEmail ?? <span className="text-gray-400 italic">Not paid yet</span>} />
                              <DetailRow label="Account Name" value={b.user?.name} />
                              <DetailRow label="Account Email" value={b.user?.email} />
                              <DetailRow label="Guests" value={`${b.guests} guest${b.guests > 1 ? 's' : ''}`} />
                            </div>

                            {/* Stay */}
                            <div className="space-y-2.5">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0f2a47] uppercase tracking-wider mb-3">
                                <Building2 className="w-3.5 h-3.5" /> Stay Details
                              </p>
                              <DetailRow label="Unit" value={b.unit?.name} />
                              <DetailRow label="Check-in" value={fmtDateTime(b.checkin)} />
                              <DetailRow label="Check-out" value={fmtDateTime(b.checkout)} />
                              <DetailRow label="Nights" value={nights} />
                              <DetailRow label="Total Charged" value={formatCurrency(b.totalPrice)} />
                            </div>

                            {/* Booking timeline */}
                            <div className="space-y-2.5">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0f2a47] uppercase tracking-wider mb-3">
                                <Clock className="w-3.5 h-3.5" /> Timeline
                              </p>
                              <DetailRow label="Booking Created" value={fmtDateTime(b.createdAt)} />
                              <DetailRow label="Last Updated" value={fmtDateTime(b.updatedAt)} />
                              <DetailRow label="Payment Confirmed"
                                value={b.payment?.createdAt ? fmtDateTime(b.payment.createdAt) : 'Not yet paid'} />
                              {b.status === 'CANCELLED' && (
                                <DetailRow label="Cancelled By"
                                  value={b.cancelledBy === 'ADMIN' ? 'Admin' : b.cancelledBy === 'GUEST' ? 'Guest' : '—'} />
                              )}
                            </div>

                            {/* Payment */}
                            <div className="space-y-2.5">
                              <p className="flex items-center gap-1.5 text-xs font-bold text-[#0f2a47] uppercase tracking-wider mb-3">
                                <CreditCard className="w-3.5 h-3.5" /> Payment
                              </p>
                              <DetailRow label="Payment Status" value={
                                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border',
                                  b.payment?.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200'
                                    : b.payment?.status === 'REFUNDED' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                )}>{b.payment?.status ?? 'PENDING'}</span>
                              } />
                              <DetailRow label="Amount" value={b.payment?.amount != null ? formatCurrency(b.payment.amount) : '—'} />
                              <DetailRow label="Stripe Session" value={
                                b.payment?.stripeSessionId
                                  ? <span className="font-mono text-xs text-gray-500">{b.payment.stripeSessionId.slice(0, 28)}…</span>
                                  : '—'
                              } />
                              <DetailRow label="Booking ID" value={
                                <span className="font-mono text-xs text-gray-500">{b.id}</span>
                              } />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-200">
                            {b.status !== 'CANCELLED' && (
                              <button onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}
                                disabled={actionId === b.id}
                                className="flex items-center gap-1.5 text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg disabled:opacity-40 transition-colors">
                                {actionId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                Cancel Booking
                              </button>
                            )}
                            {b.status === 'CONFIRMED' && (
                              <button onClick={(e) => { e.stopPropagation(); handleRefund(b.id); }}
                                disabled={actionId === b.id}
                                className="flex items-center gap-1.5 text-sm text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg disabled:opacity-40 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" /> Issue Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
