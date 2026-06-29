const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

function auth(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  name: string;
  slug: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sqft: number | null;
  pricePerNight: number;
  cleaningFee: number;
  description: string[];
  amenities: string[];
  images: string[];
  icalUrl: string | null;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  averageRating: number;
  reviewCount: number;
}

export interface Booking {
  id: string;
  checkin: string;
  checkout: string;
  guests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  createdAt: string;
  unit?: { id: string; name: string; slug: string; images: string[] };
  user?: { id: string; email: string; firstName: string | null; lastName: string | null };
}

export interface PaginatedBookings {
  data: Booking[];
  total: number;
  page: number;
  lastPage: number;
}

export interface Review {
  id: string;
  rating: number;
  content: string;
  userName: string;
  featured: boolean;
  createdAt: string;
  unit?: { name: string };
  user?: { email: string };
}

export interface Testimonial {
  id: string;
  guestName: string;
  location: string | null;
  content: string;
  rating: number | null;
  imageUrl: string | null;
  order: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  unitId: string | null;
  unitName: string | null;
}

export interface AdminStats {
  totalRevenue: number;
  revenueThisMonth: number;
  totalBookings: number;
  bookingsThisMonth: number;
  occupancyRate: number;
  upcomingCheckins: number;
  upcomingCheckouts: number;
  totalGuests: number;
  totalUnits: number;
  unitsSummary: Array<{
    unitId: string;
    unitName: string;
    status: string;
    nextCheckin: string | null;
    nextCheckout: string | null;
    totalBookings: number;
  }>;
}

export interface BlockedDate {
  id: string;
  date: string;
  source: 'BOOKING' | 'ICAL' | 'MANUAL';
  unitId: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const api = {
  // Units — backend routes: POST/PUT/DELETE /units, POST/DELETE /units/:id/images, PUT /units/:id/ical
  units: {
    list: () => request<Unit[]>('/units'),
    get: (slug: string) => request<Unit>(`/units/${slug}`),
    create: (body: Partial<Unit>, token: string) =>
      request<Unit>('/units', { method: 'POST', body: JSON.stringify(body), headers: auth(token) }),
    update: (id: string, body: Partial<Unit>, token: string) =>
      request<Unit>(`/units/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: auth(token) }),
    delete: (id: string, token: string) =>
      request<void>(`/units/${id}`, { method: 'DELETE', headers: auth(token) }),
    uploadImage: (id: string, formData: FormData, token: string) =>
      // backend uses FilesInterceptor('files') — field must be 'files'
      fetch(`${BASE}/units/${id}/images`, {
        method: 'POST',
        headers: auth(token),
        body: formData,
      }).then((r) => r.json()),
    deleteImage: (id: string, url: string, token: string) =>
      request<void>(`/units/${id}/images`, {
        method: 'DELETE',
        body: JSON.stringify({ url }),
        headers: auth(token),
      }),
    updateIcal: (id: string, icalUrl: string, token: string) =>
      request<Unit>(`/units/${id}/ical`, {
        method: 'PUT',
        body: JSON.stringify({ icalUrl }),
        headers: auth(token),
      }),
  },

  // Bookings — backend: GET/POST /bookings (admin guard on GET all), PUT /bookings/:id/cancel
  bookings: {
    list: (token: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedBookings>(`/bookings${qs}`, { headers: auth(token) });
    },
    cancel: (id: string, token: string) =>
      request<void>(`/bookings/${id}/cancel`, { method: 'PUT', headers: auth(token) }),
    // Admin refund goes through admin/payments/:id/refund
    refund: (id: string, token: string) =>
      request<void>(`/admin/payments/${id}/refund`, { method: 'POST', headers: auth(token) }),
  },

  // Calendar — backend: GET /admin/calendar/:unitId, POST /admin/block {unitId,dates[]}, DELETE /admin/block/:id
  calendar: {
    blocked: (unitId: string, token: string) =>
      request<BlockedDate[]>(`/admin/calendar/${unitId}`, { headers: auth(token) }),
    block: (unitId: string, dates: string[], token: string) =>
      request<void>(`/admin/block`, {
        method: 'POST',
        body: JSON.stringify({ unitId, dates }),
        headers: auth(token),
      }),
    unblock: (id: string, token: string) =>
      request<void>(`/admin/block/${id}`, { method: 'DELETE', headers: auth(token) }),
  },

  // Reviews — backend: GET /admin/reviews, PUT /reviews/:id/feature, DELETE /reviews/:id
  reviews: {
    list: (token: string) => request<Review[]>('/admin/reviews', { headers: auth(token) }),
    feature: (id: string, featured: boolean, token: string) =>
      request<Review>(`/reviews/${id}/feature`, {
        method: 'PUT',
        body: JSON.stringify({ featured }),
        headers: auth(token),
      }),
    delete: (id: string, token: string) =>
      request<void>(`/reviews/${id}`, { method: 'DELETE', headers: auth(token) }),
  },

  // Testimonials — backend: GET/POST/PUT/DELETE /testimonials (admin guarded via guards)
  testimonials: {
    list: () => request<Testimonial[]>('/testimonials'),
    create: (body: Partial<Testimonial>, token: string) =>
      request<Testimonial>('/testimonials', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: auth(token),
      }),
    update: (id: string, body: Partial<Testimonial>, token: string) =>
      request<Testimonial>(`/testimonials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: auth(token),
      }),
    delete: (id: string, token: string) =>
      request<void>(`/testimonials/${id}`, { method: 'DELETE', headers: auth(token) }),
  },

  // Gallery — backend: GET/POST/PUT/DELETE /gallery (admin guarded via guards)
  gallery: {
    list: () => request<GalleryImage[]>('/gallery'),
    upload: (formData: FormData, token: string) =>
      fetch(`${BASE}/gallery`, {
        method: 'POST',
        headers: auth(token),
        body: formData,
      }).then((r) => r.json()),
    update: (id: string, body: Partial<GalleryImage>, token: string) =>
      request<GalleryImage>(`/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: auth(token),
      }),
    delete: (id: string, token: string) =>
      request<void>(`/gallery/${id}`, { method: 'DELETE', headers: auth(token) }),
  },

  // Stats
  stats: {
    get: (token: string) => request<AdminStats>('/admin/stats', { headers: auth(token) }),
  },

  // iCal — backend: POST /ical/sync/:unitId
  ical: {
    sync: (unitId: string, token: string) =>
      request<void>(`/ical/sync/${unitId}`, { method: 'POST', headers: auth(token) }),
  },
};
