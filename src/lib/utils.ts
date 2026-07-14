import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate an 8-digit automatic barcode
export function generateAutoBarcode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Check if a YYYY-MM string is expired (before current month)
export function isExpired(expiryMonth?: string): boolean {
  if (!expiryMonth) return false;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  
  const [expYearStr, expMonthStr] = expiryMonth.split('-');
  const expYear = parseInt(expYearStr, 10);
  const expMonth = parseInt(expMonthStr, 10);
  
  if (expYear < currentYear) return true;
  if (expYear === currentYear && expMonth < currentMonth) return true;
  
  return false;
}
