import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `₹${numPrice.toLocaleString('en-IN')}`;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateOrderNumber(): string {
  return `CBG${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

export function calculateDeliveryDate(deliveryTime: string): Date {
  const now = new Date();
  
  switch (deliveryTime) {
    case 'same-day':
      return now;
    case 'midnight':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    case 'next-day':
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
    default:
      return now;
  }
}

export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}
