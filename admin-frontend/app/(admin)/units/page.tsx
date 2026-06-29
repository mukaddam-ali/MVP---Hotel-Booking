'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Unit } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Loader2, Plus, Pencil, Trash2, X, Save, Upload, Image as ImageIcon,
  RefreshCw, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const UNIT_TYPES = [
  'Efficiency', 'Studio', 'Studio Loft',
  'One Bedroom', 'Two Bedroom', 'Cottage / One Bedroom',
];
const STATUS_OPTS = ['AVAILABLE', 'MAINTENANCE', 'INACTIVE'];
const COMMON_AMENITIES = [
  'WiFi', 'Air Conditioning', 'Full Kitchen', 'Washer', 'Dryer',
  'Pool Access', 'Parking', 'Beach Access', 'Smart TV', 'Coffee Maker',
  'Dishwasher', 'Balcony', 'Ocean View', 'Pet Friendly',
];

type Editable = Partial<Unit> & { id?: string };

function emptyUnit(): Editable {
  return {
    name: '', type: 'Studio', bedrooms: 1, bathrooms: 1, maxGuests: 2,
    pricePerNight: 0, cleaningFee: 0, description: [], amenities: [],
    images: [], status: 'AVAILABLE', icalUrl: null, sqft: null,
  };
}

export default function UnitsPage() {
  const { getToken } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editable | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [syncId, setSyncId] = useState<string | null>(null);
  const [descText, setDescText] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await api.units.list().catch(() => []);
    setUnits(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openEdit(u?: Unit) {
    const base = u ? { ...u } : emptyUnit();
    setEditing(base);
    setDescText(Array.isArray(base.description) ? base.description.join('\n\n') : '');
    setError('');
  }

  async function handleSave() {
    if (!editing?.name) { setError('Unit name is required.'); return; }
    setSaving(true);
    setError('');
    const token = await getToken();
    const body = {
      ...editing,
      description: descText.split('\n\n').map((s) => s.trim()).filter(Boolean),
    };
    if (editing.id) {
      await api.units.update(editing.id, body, token!).catch((e) => setError(e.message));
    } else {
      await api.units.create(body, token!).catch((e) => setError(e.message));
    }
    await load();
    if (!error) setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unit? This cannot be undone.')) return;
    const token = await getToken();
    await api.units.delete(id, token!).catch(() => {});
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleImageUpload(files: FileList) {
    if (!editing?.id || !files.length) return;
    setImgUploading(true);
    const token = await getToken();
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('files', file); // backend uses FilesInterceptor('files')
      const res = await api.units.uploadImage(editing.id, fd, token!).catch(() => null);
      if (res?.images) setEditing((prev) => prev ? { ...prev, images: res.images } : prev);
    }
    setImgUploading(false);
  }

  async function handleImageDelete(url: string) {
    if (!editing?.id) return;
    const token = await getToken();
    await api.units.deleteImage(editing.id, url, token!).catch(() => {});
    setEditing((prev) => prev ? { ...prev, images: (prev.images ?? []).filter((i) => i !== url) } : prev);
  }

  async function handleIcalSave() {
    if (!editing?.id || editing.icalUrl === undefined) return;
    const token = await getToken();
    await api.units.updateIcal(editing.id, editing.icalUrl ?? '', token!).catch(() => {});
  }

  async function handleSync(unitId: string) {
    setSyncId(unitId);
    const token = await getToken();
    await api.ical.sync(unitId, token!).catch(() => {});
    setSyncId(null);
  }

  function toggleAmenity(a: string) {
    setEditing((prev) => {
      if (!prev) return prev;
      const list = prev.amenities ?? [];
      return { ...prev, amenities: list.includes(a) ? list.filter((x) => x !== a) : [...list, a] };
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex justify-end">
        <button
          onClick={() => openEdit()}
          className="flex items-center gap-2 bg-[#0f2a47] hover:bg-[#1a3a5c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Unit', 'Type', 'Guests', 'Price/night', 'Status', 'iCal', ''].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#0f2a47]">{u.name}</p>
                    <p className="text-gray-400 text-xs">{u.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.type}</td>
                  <td className="px-5 py-4 text-gray-600">{u.maxGuests}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800">{formatCurrency(u.pricePerNight)}</td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full border',
                      u.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200'
                        : u.status === 'MAINTENANCE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    )}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.icalUrl ? (
                      <button
                        onClick={() => handleSync(u.id)}
                        disabled={syncId === u.id}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40"
                      >
                        {syncId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">None</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-[#0f2a47] hover:bg-gray-100 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto flex items-start justify-center p-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#0f2a47] text-lg">{editing.id ? 'Edit Unit' : 'Add New Unit'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Unit Name *</label>
                  <input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="input" placeholder="Unit 101 — Ocean View Studio" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select value={editing.type ?? 'Studio'} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="input">
                    {UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={editing.status ?? 'AVAILABLE'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="input">
                    {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Bedrooms</label>
                  <input type="number" min={0} value={editing.bedrooms ?? 1} onChange={(e) => setEditing({ ...editing, bedrooms: +e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Bathrooms</label>
                  <input type="number" min={1} step={0.5} value={editing.bathrooms ?? 1} onChange={(e) => setEditing({ ...editing, bathrooms: +e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Max Guests</label>
                  <input type="number" min={1} value={editing.maxGuests ?? 2} onChange={(e) => setEditing({ ...editing, maxGuests: +e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Sq Ft</label>
                  <input type="number" value={editing.sqft ?? ''} onChange={(e) => setEditing({ ...editing, sqft: e.target.value ? +e.target.value : null })} className="input" placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Price / Night ($)</label>
                  <input type="number" min={0} value={editing.pricePerNight ?? 0} onChange={(e) => setEditing({ ...editing, pricePerNight: +e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Cleaning Fee ($)</label>
                  <input type="number" min={0} value={editing.cleaningFee ?? 0} onChange={(e) => setEditing({ ...editing, cleaningFee: +e.target.value })} className="input" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <p className="text-xs text-gray-400 mb-1">Separate paragraphs with a blank line.</p>
                <textarea value={descText} onChange={(e) => setDescText(e.target.value)} rows={5} className="input resize-none" />
              </div>

              {/* Amenities */}
              <div>
                <label className="label">Amenities</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COMMON_AMENITIES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                        (editing.amenities ?? []).includes(a)
                          ? 'bg-[#0f2a47] text-white border-[#0f2a47]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f2a47]'
                      )}
                    >{a}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && amenityInput.trim()) {
                        toggleAmenity(amenityInput.trim());
                        setAmenityInput('');
                      }
                    }}
                    placeholder="Custom amenity + Enter"
                    className="input flex-1"
                  />
                </div>
              </div>

              {/* iCal */}
              <div>
                <label className="label">iCal URL (Airbnb/VRBO sync)</label>
                <div className="flex gap-2">
                  <input
                    value={editing.icalUrl ?? ''}
                    onChange={(e) => setEditing({ ...editing, icalUrl: e.target.value || null })}
                    placeholder="https://www.airbnb.com/calendar/ical/…"
                    className="input flex-1"
                  />
                  {editing.id && (
                    <button onClick={handleIcalSave} className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">Save</button>
                  )}
                </div>
              </div>

              {/* Images — only for existing units */}
              {editing.id && (
                <div>
                  <label className="label">Photos</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {(editing.images ?? []).map((url) => (
                      <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleImageDelete(url)}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={imgUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#0f2a47] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#0f2a47] transition-colors"
                    >
                      {imgUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="text-xs">Upload</span>
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
                </div>
              )}
              {!editing.id && (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                  Save the unit first, then re-open it to upload photos.
                </p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0f2a47] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label { display:block; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:0.25rem; }
        .input { width:100%; border:1px solid #e5e7eb; border-radius:0.75rem; padding:0.625rem 0.75rem; font-size:0.875rem; color:#374151; outline:none; }
        .input:focus { ring: 2px solid #0f2a47; border-color:#0f2a47; }
      `}</style>
    </div>
  );
}
