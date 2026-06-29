'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { api, GalleryImage, Unit } from '@/lib/api';
import { Loader2, Upload, Trash2, Pencil, X, Save, Image as ImageIcon } from 'lucide-react';

export default function GalleryPage() {
  const { getToken } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editUnitId, setEditUnitId] = useState('');
  const [uploadUnitId, setUploadUnitId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [imgs, us] = await Promise.all([
      api.gallery.list().catch(() => []),
      api.units.list().catch(() => []),
    ]);
    setImages(imgs);
    setUnits(us);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleUpload(files: FileList) {
    if (!files.length) return;
    setUploading(true);
    const token = await getToken();
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      if (uploadUnitId) fd.append('unitId', uploadUnitId);
      await api.gallery.upload(fd, token!).catch(() => {});
    }
    await load();
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    const token = await getToken();
    await api.gallery.delete(id, token!).catch(() => {});
    setImages((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleEditSave(id: string) {
    const token = await getToken();
    await api.gallery.update(id, { caption: editCaption || null, unitId: editUnitId || null }, token!).catch(() => {});
    await load();
    setEditId(null);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Upload zone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">Upload Photos</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Tag to Unit (optional)</label>
            <select
              value={uploadUnitId}
              onChange={(e) => setUploadUnitId(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
            >
              <option value="">Property-wide</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-[#0f2a47] hover:bg-[#1a3a5c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Choose Files'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-[#0f2a47]" /></div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No images yet. Upload some above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img src={img.url} alt={img.caption ?? ''} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                {editId === img.id ? (
                  <div className="space-y-2">
                    <input
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Caption"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                    />
                    <select
                      value={editUnitId}
                      onChange={(e) => setEditUnitId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0f2a47]"
                    >
                      <option value="">Property-wide</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditSave(img.id)} className="flex-1 flex items-center justify-center gap-1 bg-[#0f2a47] text-white rounded-lg py-1.5 text-xs font-medium">
                        <Save className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => setEditId(null)} className="px-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 truncate">{img.caption ?? img.unitName ?? 'Property-wide'}</p>
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => { setEditId(img.id); setEditCaption(img.caption ?? ''); setEditUnitId(img.unitId ?? ''); }}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-500 hover:text-[#0f2a47] hover:border-[#0f2a47] transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(img.id)}
                        className="px-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
