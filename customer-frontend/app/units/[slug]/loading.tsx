export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
      {/* Image skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="w-full h-80 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-4">
              {[80, 70, 90].map((w, i) => (
                <div key={i} className={`h-4 w-${w} bg-gray-100 rounded animate-pulse`} />
              ))}
            </div>
            <div className="space-y-2 mt-4">
              {[100, 90, 95, 75].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
