import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function generateSessionId(): string {
  return crypto.randomUUID();
}

export function generateShortId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function maskApiKey(apiKey: string, visibleChars: number = 4): string {
  if (apiKey.length <= visibleChars * 2) return apiKey;
  
  const start = apiKey.slice(0, visibleChars);
  const end = apiKey.slice(-visibleChars);
  const masked = '*'.repeat(Math.max(0, apiKey.length - visibleChars * 2));
  
  return `${start}${masked}${end}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

// 通貨コードから記号を取得
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'JPY': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CNY': '¥',
    'KRW': '₩',
  };
  return symbols[currency.toUpperCase()] || currency;
}

// 環境変数の取得（フロントエンド用）
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  if (typeof window !== 'undefined') {
    // クライアントサイドでは Next.js の public 環境変数のみアクセス可能
    return process.env[`NEXT_PUBLIC_${key}`] || defaultValue;
  }
  return process.env[key] || defaultValue;
}