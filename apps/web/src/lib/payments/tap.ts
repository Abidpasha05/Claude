// Tap Payments integration. https://www.tap.company/
// Docs: https://developers.tap.company/reference/api-overview
//
// Flow:
//   1. createIntent() → POST /v2/charges, returns transaction.url for redirect
//   2. Customer pays on Tap-hosted page
//   3. Customer redirected back to our return_url with tap_id query param
//   4. Tap calls our webhook (/api/payments/tap/webhook) with the final status
//   5. verifyWebhook() validates the hashstring header and returns order_id + status

import { createHmac } from 'node:crypto';
import type { PaymentGateway } from './index';

export const tapPayments: PaymentGateway = {
  name: 'tap',
  supports: (m) => m === 'tap' || m === 'card' || m === 'mada' || m === 'apple_pay',

  async createIntent({ amount, currency, method, order_id, customer_email, return_url }) {
    if (!process.env.TAP_SECRET_KEY) {
      // Mock mode — useful for local dev without Tap credentials.
      return {
        id: `mock_tap_${order_id}`,
        status: 'pending',
        redirect_url: `${return_url}?tap_id=mock_tap_${order_id}&mock=1`,
      };
    }

    const source = method === 'mada' ? { id: 'src_sa.mada' }
      : method === 'apple_pay' ? { id: 'src_apple_pay' }
      : { id: 'src_card' };

    const res = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        threeDSecure: true,
        save_card: false,
        description: `Order ${order_id}`,
        statement_descriptor: 'Arkan',
        metadata: { order_id },
        reference: { order: order_id, transaction: order_id },
        receipt: { email: !!customer_email, sms: false },
        customer: customer_email ? { email: customer_email, first_name: 'Guest' } : { first_name: 'Guest' },
        source,
        post: { url: process.env.TAP_WEBHOOK_URL ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/tap/webhook` },
        redirect: { url: return_url },
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.id) {
      throw new Error(`Tap createIntent failed: ${JSON.stringify(json)}`);
    }

    return {
      id: json.id,
      status: json.status === 'CAPTURED' ? 'succeeded' : 'requires_action',
      redirect_url: json.transaction?.url,
    };
  },

  async verifyWebhook(payload, signature) {
    let evt: any;
    try {
      evt = JSON.parse(payload);
    } catch {
      return null;
    }

    if (process.env.TAP_SECRET_KEY) {
      // Tap webhook hashstring spec:
      // https://developers.tap.company/docs/webhook
      // Hashed fields in fixed order — `x{id}{amount}{currency}{gateway.reference}{payment.reference}{status}{created}`
      const toSign =
        `x${evt.id ?? ''}` +
        `${evt.amount ?? ''}` +
        `${evt.currency ?? ''}` +
        `${evt.gateway?.reference ?? ''}` +
        `${evt.payment?.reference ?? ''}` +
        `${evt.status ?? ''}` +
        `${evt.created ?? ''}`;

      const expected = createHmac('sha256', process.env.TAP_SECRET_KEY)
        .update(toSign)
        .digest('hex');

      if (!signature || signature.toLowerCase() !== expected.toLowerCase()) {
        return null;
      }
    }

    const order_id = evt?.metadata?.order_id ?? evt?.reference?.order;
    if (!order_id) return null;

    const status: 'paid' | 'failed' = evt.status === 'CAPTURED' ? 'paid' : 'failed';
    return { order_id, status };
  },
};

/**
 * Server-side helper for the redirect-back page to confirm a charge by id.
 * Useful for showing the right status to the customer immediately, instead of
 * waiting for the webhook to land.
 */
export async function retrieveTapCharge(chargeId: string): Promise<{
  status: string;
  order_id?: string;
} | null> {
  if (chargeId.startsWith('mock_tap_')) {
    return { status: 'CAPTURED', order_id: chargeId.replace('mock_tap_', '') };
  }
  if (!process.env.TAP_SECRET_KEY) return null;

  const res = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
    headers: { Authorization: `Bearer ${process.env.TAP_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return {
    status: json.status,
    order_id: json.metadata?.order_id ?? json.reference?.order,
  };
}
