'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Testimonial } from '@/lib/api';
import { Loader2, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const EMPTY: Partial<Testimonial> = { guestName: '', location: '', content: '', rating: 5, order: 0 };

export default function TestimonialsPage() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await api.testimonials.list().catch(() => []);
    // Only manual testimonials come from /testimonials — filter by having no reviewId field
    setItems(data.filter((t: any) => !t.bookingId));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!editing?.guestName || !editing?.content) {
      setError('Guest name and content are required.');
      return;
    }
    setSaving(true);
    setError('');
    const token = await getToken();
    if (editing.id) {
      await api.testimonials.update(editing.id, editing, token!).catch((e) => setError(e.message));
    } else {
      await api.testimonials.create(editing, token!).catch((e) => setError(e.message));
    }
    await load();
    setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this testimonial?')) return;
    const token = await getToken();
    await api.testimonials.delete(id, token!).catch(() => {});
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Manually written testimonials shown on the homepage alongside featured reviews.</p>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-2 bg-[#0f2a47] hover:bg-[#1a3a5c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {/* Form modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#0f2a47] text-lg">{editing.id ? 'Edit' : 'Add'} Testimonial</h2>
              <button onClick={() => { setEditing(null); setError(''); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Guest Name *</label>
                <input
                  value={editing.guestName ?? ''}
                  onChange={(e) => setEditing({ ...editing, guestName: e.target.value })}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Location</label>
                <input
                  value={editing.location ?? ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  placeholder="e.g. New York, NY"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Content *</label>
                <textarea
                  value={editing.content ?? ''}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={4}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Rating (1-5)</label>
                  <input
                    type="number"
                    min={1} max={5}
                    value={editing.rating ?? 5}
                    onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Order</label>
                  <input
                    type="number"
                    value={editing.order ?? 0}
                    onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setEditing(null); setError(''); }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0f2a47] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p>No testimonials yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-[#0f2a47] text-sm">{t.guestName}</p>
                  {t.location && <span className="text-xs text-gray-400">· {t.location}</span>}
                  {t.rating && <span className="text-xs text-[#c9a84c] font-bold ml-auto">{'★'.repeat(t.rating)}</span>}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{t.content}</p>
                <p className="text-gray-400 text-xs mt-2">Order: {t.order}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => setEditing({ ...t })} className="p-2 text-gray-400 hover:text-[#0f2a47] hover:bg-gray-50 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
