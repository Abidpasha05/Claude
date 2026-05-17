// Driver advances a delivery: pickup → out_for_delivery → completed.

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ALLOWED = ['out_for_delivery', 'completed'] as const;

export async function POST(req: Request) {
  const { order_id, status } = await req.json();
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const update: any = { status };
  if (status === 'out_for_delivery') update.driver_picked_up_at = new Date().toISOString();
  if (status === 'completed') update.completed_at = new Date().toISOString();

  const { data: order, error } = await admin
    .from('orders')
    .update(update)
    .eq('id', order_id)
    .eq('driver_id', user.id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: 'Not your order' }, { status: 403 });
  }

  await admin.from('order_status_history').insert({
    order_id,
    status,
    changed_by: user.id,
  });

  // Increment delivery count on completion.
  if (status === 'completed') {
    await admin.rpc('increment_driver_deliveries', { p_user_id: user.id }).catch(() => {});
  }

  // Trigger order-update push to the customer.
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin}/api/notifications/order-update`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ order_id }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
