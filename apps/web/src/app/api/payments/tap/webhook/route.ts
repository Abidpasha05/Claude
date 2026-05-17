import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { tapPayments } from '@/lib/payments/tap';

// Tap calls this endpoint server-to-server when a charge changes state.
// The customer's browser is separately redirected back via /orders/[id]/return.
//
// We trust ONLY the webhook for authoritative payment status — the redirect
// can be tampered with by a user, the webhook cannot (signature verified).
export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get('hashstring') ?? req.headers.get('x-tap-signature') ?? '';

  const result = await tapPayments.verifyWebhook(payload, signature);
  if (!result) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = await createAdminClient();
  const { order_id, status } = result;

  const { data: order } = await admin
    .from('orders')
    .select('id, status, payment_status')
    .eq('id', order_id)
    .single();
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Idempotency: skip if we've already recorded the final state.
  if (order.payment_status === 'paid' && status === 'paid') {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const nextStatus = status === 'paid' ? 'placed' : 'failed';
  const update: any = { payment_status: status };
  if (status === 'paid' && order.status === 'pending_payment') update.status = 'placed';
  if (status === 'failed') update.status = 'failed';

  await admin.from('orders').update(update).eq('id', order_id);
  await admin.from('order_status_history').insert({
    order_id,
    status: nextStatus,
    notes: status === 'paid' ? 'Payment confirmed by Tap' : 'Payment failed at Tap',
  });

  return NextResponse.json({ ok: true });
}
