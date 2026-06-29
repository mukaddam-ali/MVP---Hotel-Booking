'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, AdminStats } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, CalendarDays, Building2, Clock, DollarSign, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      const s = await api.stats.get(token).catch(() => null);
      setStats(s);
      setLoading(false);
    })();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#0f2a47]" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue This Month', value: formatCurrency(stats?.revenueThisMonth ?? 0), icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: 'Upcoming Check-ins', value: stats?.upcomingCheckins ?? 0, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Total Units', value: stats?.totalUnits ?? 0, icon: Building2, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening at Pompano Beach Pointe.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Manage Units', href: '/units', desc: 'Add, edit, or update pricing', icon: Building2 },
            { label: 'View Bookings', href: '/bookings', desc: 'See all reservations', icon: CalendarDays },
            { label: 'Manage Gallery', href: '/gallery', desc: 'Upload and organize photos', icon: TrendingUp },
          ].map(({ label, href, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#0f2a47]/30 hover:shadow-md transition-all flex gap-4 items-center"
            >
              <div className="w-10 h-10 bg-[#0f2a47]/5 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#0f2a47]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
