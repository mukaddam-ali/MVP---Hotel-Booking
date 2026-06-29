import { clsx, type ClassValue } from 'clsx';
import { format, differenceInDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function nightsBetween(checkin: string | Date, checkout: string | Date) {
  return differenceInDays(new Date(checkout), new Date(checkin));
}

export function toDateString(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export const UNIT_TYPE_LABELS: Record<string, string> = {
  'Studio': 'Studio',
  'Studio Loft': 'Studio Loft',
  'Efficiency': 'Efficiency',
  'One Bedroom': 'One Bedroom',
  'Two Bedroom': 'Two Bedroom',
  'Cottage / One Bedroom': 'Cottage',
};

export function cloudinaryUrl(url: string, width: number): string {
  if (!url || !url.includes('cloudinary.com/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}

export const AMENITY_ICONS: Record<string, string> = {
  'WiFi': '📶',
  'Pool': '🏊',
  'Parking': '🅿️',
  'Kitchen': '🍳',
  'Air Conditioning': '❄️',
  'Washer/Dryer': '🧺',
  'TV': '📺',
  'Balcony': '🌅',
  'Ocean View': '🌊',
  'Pet Friendly': '🐾',
};
