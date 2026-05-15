// Tap Payments stub. https://www.tap.company/

import type { PaymentGateway } from './index';

export const tapPayments: PaymentGateway = {
  name: 'tap',
  supports: (m) => m === 'tap' || m === 'card' || m === 'mada' || m === 'apple_pay',
  async createIntent({ amount, currency, order_id, customer_email, return_url }) {
    if (!process.env.TAP_SECRET_KEY) {
      return { id: `mock_tap_${order_id}`, status: 'pending', redirect_url: return_url };
    }
    const res = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TAP_SECRET_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        customer: { email: customer_email },
        source: { id: 'src_all' },
        redirect: { url: return_url },
        reference: { order: order_id },
      }),
    });
    const json = await res.json();
    return {
      id: json.id,
      status: json.status === 'CAPTURED' ? 'succeeded' : 'requires_action',
      redirect_url: json.transaction?.url,
    };
  },
  async verifyWebhook(payload) {
    try {
      const evt = JSON.parse(payload);
      const status = evt?.status === 'CAPTURED' ? 'paid' : 'failed';
      return { order_id: evt?.reference?.order, status };
    } catch {
      return null;
    }
  },
};
