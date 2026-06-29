'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Review } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Star, Loader2, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';

export default function ReviewsPage() {
  const { getToken } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function load() {
    const token = await getToken();
    if (!token) return;
    const data = await api.reviews.list(token).catch(() => []);
    setReviews(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleFeature(r: Review) {
    setActionId(r.id);
    const token = await getToken();
    await api.reviews.feature(r.id, !r.featured, token!).catch(() => {});
    await load();
    setActionId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review?')) return;
    setActionId(id);
    const token = await getToken();
    await api.reviews.delete(id, token!).catch(() => {});
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setActionId(null);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <p className="text-sm text-gray-500">
        Featured reviews appear on the homepage testimonials carousel alongside manually written testimonials.
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-gray-400 py-12">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-[#0f2a47] text-sm">{r.userName}</p>
                    {r.unit && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{r.unit.name}</span>}
                    <div className="flex gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.content}</p>
                  <p className="text-gray-400 text-xs mt-2">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                {r.featured && (
                  <span className="text-xs font-semibold text-[#c9a84c] bg-[#c9a84c]/10 px-2.5 py-1 rounded-full">
                    Featured on homepage
                  </span>
                )}
                <button
                  onClick={() => toggleFeature(r)}
                  disabled={actionId === r.id}
                  className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0f2a47] transition-colors disabled:opacity-40"
                >
                  {actionId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : r.featured ? <BookmarkCheck className="w-4 h-4 text-[#c9a84c]" /> : <Bookmark className="w-4 h-4" />}
                  {r.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={actionId === r.id}
                  className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
