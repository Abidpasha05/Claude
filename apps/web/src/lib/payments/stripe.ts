import type { PaymentGateway } from './index';

export const stripeGateway: PaymentGateway = {
  name: 'stripe',
  supports: (m) => m === 'stripe' || m === 'card' || m === 'apple_pay',
  async createIntent({ amount, currency, order_id, customer_email, return_url }) {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { id: `mock_stripe_${order_id}`, status: 'pending', redirect_url: return_url };
    }
    const params = new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency: currency.toLowerCase(),
      'metadata[order_id]': order_id,
      automatic_payment_methods: 'enabled',
    });
    if (customer_email) params.set('receipt_email', customer_email);
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const json = await res.json();
    return {
      id: json.id,
      status: 'pending',
      client_secret: json.client_secret,
    };
  },
  async verifyWebhook(payload) {
    // TODO: verify signature with STRIPE_WEBHOOK_SECRET
    try {
      const evt = JSON.parse(payload);
      const order_id = evt?.data?.object?.metadata?.order_id;
      const ok = evt?.type === 'payment_intent.succeeded';
      return { order_id, status: ok ? 'paid' : 'failed' };
    } catch {
      return null;
    }
  },
};
