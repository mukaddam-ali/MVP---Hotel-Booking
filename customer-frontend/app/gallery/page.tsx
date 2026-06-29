import { api } from '@/lib/api';

export const revalidate = 60;

export default async function GalleryPage() {
  const images = await api.gallery.list().catch(() => []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0f2a47] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Photo Gallery</h1>
          <p className="text-white/60">A look at Pompano Beach Pointe Residences</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {images.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No gallery photos yet.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {images.map((img) => (
              <div key={img.id} className="break-inside-avoid rounded-xl overflow-hidden shadow-sm group">
                <div className="relative">
                  <img
                    src={img.url}
                    alt={img.caption ?? ''}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {(img.caption || img.unitName) && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">{img.caption ?? img.unitName}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
