// HyperPay stub. https://www.hyperpay.com/

import type { PaymentGateway } from './index';

export const hyperpay: PaymentGateway = {
  name: 'hyperpay',
  supports: (m) => m === 'hyperpay' || m === 'card' || m === 'mada',
  async createIntent({ amount, currency, order_id, return_url }) {
    if (!process.env.HYPERPAY_ACCESS_TOKEN) {
      return { id: `mock_hyperpay_${order_id}`, status: 'pending', redirect_url: return_url };
    }
    // TODO: implement HyperPay COPYandPAY flow
    return { id: 'todo', status: 'requires_action' };
  },
  async verifyWebhook() {
    return null;
  },
};
