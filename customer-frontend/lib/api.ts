// Server components use localhost for low-latency calls; client uses the public URL
const API =
  typeof window === 'undefined'
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '')
    : (process.env.NEXT_PUBLIC_API_URL ?? '');

async function request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  if (!API) throw new Error('NEXT_PUBLIC_API_URL is not set');
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options?.headers };
  if (token) (headers as any)['Authorization'] = `Bearer ${token}`;
  // Cache public GET requests for 60s; skip caching for auth'd or mutating requests
  const method = options?.method?.toUpperCase() ?? 'GET';
  const cacheOpts = method === 'GET' && !token ? { next: { revalidate: 60 } } : {};
  const res = await fetch(`${API}${path}`, { ...options, headers, ...cacheOpts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  units: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<Unit[]>(`/units${qs}`);
    },
    get: (slug: string) => request<Unit>(`/units/${slug}`),
  },
  availability: {
    check: (unitId: string, checkin: string, checkout: string) =>
      request<AvailabilityResult>(`/availability/${unitId}?checkin=${checkin}&checkout=${checkout}`),
  },
  bookings: {
    create: (body: CreateBookingBody, token: string) =>
      request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(body) }, token),
    mine: (token: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedBookings>(`/bookings/mine${qs}`, {}, token);
    },
    get: (id: string, token: string) => request<BookingDetail>(`/bookings/${id}`, {}, token),
    cancel: (id: string, token: string) =>
      request<{ id: string; status: string }>(`/bookings/${id}/cancel`, { method: 'PUT' }, token),
  },
  payments: {
    createSession: (body: CreateSessionBody, token: string) =>
      request<{ sessionId: string; url: string }>('/payments/session', { method: 'POST', body: JSON.stringify(body) }, token),
  },
  reviews: {
    list: (unitId: string) => request<Review[]>(`/reviews/${unitId}`),
    create: (body: CreateReviewBody, token: string) =>
      request<Review>('/reviews', { method: 'POST', body: JSON.stringify(body) }, token),
  },
  testimonials: {
    list: () => request<Testimonial[]>('/testimonials'),
  },
  gallery: {
    list: (unitId?: string) => {
      const qs = unitId ? `?unitId=${unitId}` : '';
      return request<GalleryImage[]>(`/gallery${qs}`);
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  slug: string;
  name: string;
  type: string;
  pricePerNight: number;
  cleaningFee: number;
  petFee: number | null;
  cancellationHours: number;
  maxGuests: number;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  description: string[];
  images: string[];
  amenities: string[];
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE';
  averageRating: number | null;
  reviewCount: number;
}

export interface AvailabilityResult {
  available: boolean;
  blockedDates: string[];
  priceSummary: {
    nights: number;
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    totalPrice: number;
  };
}

export interface Booking {
  id: string;
  unitId: string;
  checkin: string;
  checkout: string;
  guests: number;
  totalPrice: number;
  status: string;
  cancelledBy: 'GUEST' | 'ADMIN' | null;
  reviewed: boolean;
  createdAt: string;
  unit?: { id: string; name: string; slug: string; images: string[]; cancellationHours: number };
}

export interface BookingDetail extends Booking {
  user: { id: string; name: string; email: string };
  payment: { status: string; stripeSessionId: string | null } | null;
}

export interface PaginatedBookings {
  data: Booking[];
  total: number;
  page: number;
  lastPage: number;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  featured: boolean;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  source: 'MANUAL' | 'REVIEW';
  guestName: string;
  location: string | null;
  content: string;
  rating: number | null;
  imageUrl: string | null;
  order: number;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
  order: number;
  unitId: string | null;
  unitName: string | null;
}

export interface CreateBookingBody {
  unitId: string;
  checkin: string;
  checkout: string;
  guests: number;
}

export interface CreateSessionBody {
  bookingId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateReviewBody {
  unitId: string;
  bookingId: string;
  rating: number;
  content: string;
}
