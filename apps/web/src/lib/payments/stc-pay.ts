// STC Pay stub. Replace with the real merchant API once credentials are issued.
// Docs: https://stcpay.com.sa/en/business/

import type { PaymentGateway } from './index';

export const stcPay: PaymentGateway = {
  name: 'stc_pay',
  supports: (m) => m === 'stc_pay',
  async createIntent({ amount, currency, order_id, return_url }) {
    // TODO: call STC Pay merchant API. For now, return a mock intent.
    if (!process.env.STC_PAY_API_KEY) {
      return {
        id: `mock_stc_${order_id}`,
        status: 'pending',
        redirect_url: return_url,
      };
    }
    // const res = await fetch('https://api.stcpay.com.sa/...', {...})
    return { id: 'todo', status: 'requires_action' };
  },
  async verifyWebhook() {
    return null;
  },
};
