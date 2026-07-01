'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, Unit } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  Loader2, Plus, Pencil, Trash2, X, Save, Upload,
  RefreshCw, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTS = ['AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'];
const COMMON_AMENITIES = [
  'WiFi', 'Air Conditioning', 'Full Kitchen', 'Washer', 'Dryer',
  'Pool Access', 'Parking', 'Beach Access', 'Smart TV', 'Coffee Maker',
  'Dishwasher', 'Balcony', 'Ocean View', 'Pet Friendly',
];
const SEASONS = [
  { key: 'winter', label: 'Winter Rate' },
  { key: 'spring', label: 'Spring Rate' },
  { key: 'summer', label: 'Summer Rate' },
  { key: 'fall',   label: 'Fall Rate' },
] as const;
type Season = 'winter' | 'spring' | 'summer' | 'fall';

type Editable = Partial<Unit> & { id?: string };

function emptyUnit(): Editable {
  return {
    name: '', bedrooms: '1', bathrooms: '1', maxGuests: 2,
    winterRate: null, springRate: null, summerRate: null, fallRate: null,
    activeSeason: null, cleaningFee: 0, petFee: null,
    cancellationHours: 24,
    description: [], amenities: [], images: [], status: 'AVAILABLE',
    icalUrl: null, sqft: null,
  };
}

function NumStepper({
  label, value, min = 0, onChange,
}: { label: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center border border-gray-200 rounded overflow-hidden w-fit">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
          onFocus={(e) => e.target.select()}
          className="w-12 h-9 text-center text-sm border-x border-gray-200 focus:outline-none"
        />
        <button type="button" onClick={() => onChange(value + 1)}
          className="w-8 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function MoneyInput({
  label, value, onChange, placeholder,
}: { label: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  const [display, setDisplay] = useState(value != null && value !== 0 ? String(value) : '');
  useEffect(() => {
    setDisplay(value != null && value !== 0 ? String(value) : '');
  }, [value]);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center border border-gray-200 focus-within:border-[#0f2a47] focus-within:ring-2 focus-within:ring-[#0f2a47]/10 rounded" style={{borderRadius:'4px'}}>
        <span className="pl-3 pr-1 text-gray-400 text-sm select-none shrink-0">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={placeholder ?? '0'}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            setDisplay(raw);
            const num = parseFloat(raw);
            onChange(isNaN(num) ? null : num);
          }}
          onBlur={() => {
            if (display === '' || display === '.') { setDisplay(''); onChange(null); }
          }}
          className="flex-1 py-2.5 pr-3 text-sm text-gray-700 focus:outline-none bg-transparent min-w-0"
        />
      </div>
    </div>
  );
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
    setAmenityInput('');
  }

  async function handleSave() {
    if (!editing?.name) { setError('Unit name is required.'); return; }
    setSaving(true); setError('');
    const token = await getToken();
    const body = {
      ...editing,
      description: descText.split('\n\n').map((s) => s.trim()).filter(Boolean),
      bedrooms: String(editing.bedrooms ?? '1'),
      bathrooms: String(editing.bathrooms ?? '1'),
      sqft: editing.sqft != null ? String(editing.sqft) : '',
    };
    let ok = true;
    if (editing.id) {
      await api.units.update(editing.id, body, token!).catch((e) => { setError(e.message); ok = false; });
    } else {
      await api.units.create(body, token!).catch((e) => { setError(e.message); ok = false; });
    }
    await load();
    if (ok) setEditing(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this unit? This cannot be undone.')) return;
    const token = await getToken();
    const err = await api.units.delete(id, token!).then(() => null).catch((e: Error) => e);
    if (err) { alert(err.message); return; }
    setUnits((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleImageUpload(files: FileList) {
    if (!editing?.id || !files.length) return;
    setImgUploading(true);
    const token = await getToken();
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('files', file);
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
    if (!editing?.id) return;
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

  const activeRate = editing?.activeSeason
    ? (editing as any)[`${editing.activeSeason}Rate`] ?? null
    : null;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex justify-end">
        <button onClick={() => openEdit()}
          className="flex items-center gap-2 bg-[#0f2a47] hover:bg-[#1a3a5c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Unit
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                {['Unit', 'Beds/Bath', 'Guests', 'Active Rate', 'Status', 'iCal', ''].map((h) => (
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
                  <td className="px-5 py-4 text-gray-600">{u.bedrooms}bd / {u.bathrooms}ba</td>
                  <td className="px-5 py-4 text-gray-600">{u.maxGuests}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-800">{formatCurrency(u.pricePerNight)}/night</p>
                    {u.activeSeason && <p className="text-xs text-[#c9a84c] capitalize">{u.activeSeason} rate</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border',
                      u.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-200'
                        : u.status === 'MAINTENANCE' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200')}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.icalUrl ? (
                      <button onClick={() => handleSync(u.id)} disabled={syncId === u.id}
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-40">
                        {syncId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Sync
                      </button>
                    ) : <span className="text-xs text-gray-300">None</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-[#0f2a47] hover:bg-gray-100 rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No units yet. Add your first unit.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit / Add modal ── */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col" style={{maxHeight:'calc(100vh - 2rem)'}}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-[#0f2a47] text-lg">{editing.id ? 'Edit Unit' : 'Add New Unit'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded">{error}</p>}

              {/* Name & status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Unit Name *</label>
                  <input value={editing.name ?? ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="input" placeholder="e.g. Unit NW" />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select value={editing.status ?? 'AVAILABLE'} onChange={(e) => setEditing({ ...editing, status: e.target.value as any })} className="input">
                    {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Sq Ft</label>
                  <input type="text" value={editing.sqft ?? ''} onChange={(e) => setEditing({ ...editing, sqft: e.target.value || null })} className="input" placeholder="Optional" />
                </div>
              </div>

              {/* Beds / Bath / Guests */}
              <div>
                <p className="label mb-3">Rooms & Guests</p>
                <div className="flex flex-wrap gap-6">
                  <NumStepper label="Bedrooms" value={Number(editing.bedrooms) || 1} min={0}
                    onChange={(v) => setEditing({ ...editing, bedrooms: String(v) })} />
                  <NumStepper label="Bathrooms" value={Number(editing.bathrooms) || 1} min={1}
                    onChange={(v) => setEditing({ ...editing, bathrooms: String(v) })} />
                  <NumStepper label="Max Guests" value={editing.maxGuests ?? 2} min={1}
                    onChange={(v) => setEditing({ ...editing, maxGuests: v })} />
                </div>
              </div>

              {/* Cancellation policy */}
              <div>
                <p className="label mb-1">Cancellation Policy</p>
                <p className="text-xs text-gray-400 mb-3">Guests can cancel free of charge up to this many hours before check-in.</p>
                <NumStepper label="Hours before check-in" value={editing.cancellationHours ?? 24} min={1}
                  onChange={(v) => setEditing({ ...editing, cancellationHours: v })} />
              </div>

              {/* Seasonal pricing */}
              <div>
                <p className="label mb-3">Seasonal Pricing — select the currently active rate</p>
                <div className="space-y-2">
                  {SEASONS.map(({ key, label }) => {
                    const rateKey = `${key}Rate` as keyof Editable;
                    const rateVal = (editing[rateKey] as number | null) ?? null;
                    const isActive = editing.activeSeason === key;
                    return (
                      <div key={key} className={cn(
                        'flex items-center gap-3 border rounded p-3 transition-colors',
                        isActive ? 'border-[#0f2a47] bg-[#0f2a47]/5' : 'border-gray-200',
                      )}>
                        {/* Active radio */}
                        <button type="button" onClick={() => setEditing({ ...editing, activeSeason: key })}
                          className={cn('w-4 h-4 rounded-full border-2 shrink-0 transition-colors',
                            isActive ? 'border-[#0f2a47] bg-[#0f2a47]' : 'border-gray-300'
                          )} />
                        <span className="text-sm font-medium text-gray-700 w-28">{label}</span>
                        <div className="flex items-center border border-gray-200 rounded max-w-40 focus-within:border-[#0f2a47] focus-within:ring-2 focus-within:ring-[#0f2a47]/10" style={{borderRadius:'4px'}}>
                          <span className="pl-3 pr-1 text-gray-400 text-sm select-none shrink-0">$</span>
                          <input
                            type="text" inputMode="numeric"
                            value={rateVal != null ? String(rateVal) : ''}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9.]/g, '');
                              const num = parseFloat(raw);
                              setEditing({ ...editing, [rateKey]: isNaN(num) ? null : num });
                            }}
                            className="flex-1 py-1.5 pr-3 text-sm text-gray-700 focus:outline-none bg-transparent min-w-0"
                          />
                        </div>
                        {isActive && (
                          <span className="text-xs font-semibold text-[#0f2a47] bg-[#0f2a47]/10 px-2 py-0.5 rounded">
                            Active · {rateVal != null ? `$${rateVal}/night` : 'set a rate'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {activeRate == null && editing.activeSeason && (
                  <p className="text-xs text-amber-600 mt-2">Set a rate for the selected season before saving.</p>
                )}
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-4">
                <MoneyInput label="Cleaning Fee ($)"
                  value={editing.cleaningFee ?? 0}
                  onChange={(v) => setEditing({ ...editing, cleaningFee: v ?? 0 })} />
                <MoneyInput label="Pet Fee ($)"
                  value={editing.petFee ?? null}
                  placeholder="0 (optional)"
                  onChange={(v) => setEditing({ ...editing, petFee: v })} />
              </div>

              {/* Description */}
              <div>
                <label className="label">Description</label>
                <p className="text-xs text-gray-400 mb-1">Separate paragraphs with a blank line.</p>
                <textarea value={descText} onChange={(e) => setDescText(e.target.value)} rows={4} className="input resize-none" />
              </div>

              {/* Amenities */}
              <div>
                <label className="label">Amenities</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COMMON_AMENITIES.map((a) => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={cn('text-xs px-3 py-1.5 rounded border transition-colors',
                        (editing.amenities ?? []).includes(a)
                          ? 'bg-[#0f2a47] text-white border-[#0f2a47]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#0f2a47]'
                      )}>{a}</button>
                  ))}
                </div>
                <input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && amenityInput.trim()) { toggleAmenity(amenityInput.trim()); setAmenityInput(''); } }}
                  placeholder="Custom amenity + Enter" className="input" />
              </div>

              {/* iCal */}
              <div>
                <label className="label">iCal URL (Airbnb / VRBO sync)</label>
                <div className="flex gap-2">
                  <input value={editing.icalUrl ?? ''}
                    onChange={(e) => setEditing({ ...editing, icalUrl: e.target.value || null })}
                    placeholder="https://www.airbnb.com/calendar/ical/…"
                    className="input flex-1" />
                  {editing.id && (
                    <button onClick={handleIcalSave} className="px-3 py-2.5 bg-blue-50 text-blue-600 rounded text-sm font-medium hover:bg-blue-100 transition-colors">Save</button>
                  )}
                </div>
              </div>

              {/* Images */}
              {editing.id ? (
                <div>
                  <label className="label">Photos</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {(editing.images ?? []).map((url) => (
                      <div key={url} className="relative group aspect-square rounded overflow-hidden border border-gray-100">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => handleImageDelete(url)}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => fileRef.current?.click()} disabled={imgUploading}
                      className="aspect-square rounded border-2 border-dashed border-gray-200 hover:border-[#0f2a47] flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-[#0f2a47] transition-colors">
                      {imgUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span className="text-xs">Upload</span>
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)} />
                </div>
              ) : (
                <p className="text-xs text-gray-400 bg-gray-50 rounded px-4 py-3">Save the unit first, then re-open it to upload photos.</p>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 rounded py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0f2a47] text-white rounded py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Unit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label { display:block; font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:0.5rem; }
        .input { width:100%; border:1px solid #e5e7eb; border-radius:4px; padding:0.625rem 0.75rem; font-size:0.875rem; color:#374151; outline:none; background:white; }
        .input:focus { border-color:#0f2a47; box-shadow:0 0 0 2px rgba(15,42,71,0.1); }
      `}</style>
    </div>
  );
}
