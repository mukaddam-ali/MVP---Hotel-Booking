'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Review } from '@/lib/api';
import { Star, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  unitId: string;
  initialReviews: Review[];
}

export default function ReviewsSection({ unitId, initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-[#0f2a47]">Guest Reviews</h2>
        <div className="flex items-center gap-1.5 bg-[#faf8f4] px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 fill-[#c9a84c] text-[#c9a84c]" />
          <span className="font-bold text-[#0f2a47] text-sm">{avg.toFixed(1)}</span>
          <span className="text-gray-400 text-sm">· {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-5">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-[#0f2a47] text-sm">{r.userName}</p>
                <p className="text-gray-400 text-xs">{formatDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-[#c9a84c] text-[#c9a84c]' : 'text-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{r.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
