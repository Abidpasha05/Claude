// Pricing helpers - kept pure for reuse on client and server.

import type { CartLine } from './types';

export interface PricingInput {
  lines: CartLine[];
  delivery_fee?: number;
  discount?: number;
  tax_rate?: number; // e.g. 0.15 for KSA VAT
  tip?: number;
}

export interface PricingResult {
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  tip: number;
  grand_total: number;
}

export function computePricing({
  lines,
  delivery_fee = 0,
  discount = 0,
  tax_rate = 0.15,
  tip = 0,
}: PricingInput): PricingResult {
  const subtotal = lines.reduce((sum, l) => {
    const modTotal = (l.modifiers ?? []).reduce((s, m) => s + m.price_delta, 0);
    return sum + (l.unit_price + modTotal) * l.quantity;
  }, 0);

  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * tax_rate);
  const grand_total = round2(taxable + tax + delivery_fee + tip);

  return {
    subtotal: round2(subtotal),
    delivery_fee: round2(delivery_fee),
    discount: round2(discount),
    tax,
    tip: round2(tip),
    grand_total,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, currency = 'SAR', locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
