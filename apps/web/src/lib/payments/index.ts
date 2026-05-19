// Payment gateway abstraction. Each provider implements the same interface so
// the rest of the app stays gateway-agnostic.

import type { PaymentMethod } from '@aklio/shared';

export interface PaymentIntent {
  id: string;
  status: 'requires_action' | 'pending' | 'succeeded' | 'failed';
  redirect_url?: string;
  client_secret?: string;
}

export interface PaymentGateway {
  name: string;
  supports(method: PaymentMethod): boolean;
  createIntent(args: {
    amount: number;
    currency: string;
    method: PaymentMethod;
    order_id: string;
    customer_email?: string;
    return_url: string;
  }): Promise<PaymentIntent>;
  verifyWebhook(payload: string, signature: string): Promise<{ order_id: string; status: 'paid' | 'failed' } | null>;
}

import { stcPay } from './stc-pay';
import { tapPayments } from './tap';
import { hyperpay } from './hyperpay';
import { stripeGateway } from './stripe';

const gateways: PaymentGateway[] = [stcPay, tapPayments, hyperpay, stripeGateway];

export function pickGateway(method: PaymentMethod, country: string): PaymentGateway | null {
  if (method === 'cash') return null;
  if (method === 'stc_pay') return stcPay;
  if (['mada', 'tap'].includes(method)) return tapPayments;
  if (method === 'hyperpay') return hyperpay;
  if (method === 'stripe') return stripeGateway;
  // Default: prefer Tap in GCC, Stripe elsewhere
  if (['SA', 'AE', 'KW', 'BH', 'OM', 'QA'].includes(country)) return tapPayments;
  return stripeGateway;
}

export { gateways };
