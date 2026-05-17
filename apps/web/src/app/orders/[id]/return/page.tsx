import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { retrieveTapCharge } from '@/lib/payments/tap';

// Customer is redirected here after paying on the Tap-hosted page.
// We confirm the charge with Tap and patch the order optimistically, but the
// webhook remains the source of truth (it can arrive before or after).
export default async function PaymentReturnPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tap_id?: string; status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const admin = await createAdminClient();

  const { data: order } = await admin
    .from('orders')
    .select('id, status, payment_status, payment_reference')
    .eq('id', id)
    .single();

  if (!order) redirect('/restaurants');

  if (sp.tap_id) {
    const charge = await retrieveTapCharge(sp.tap_id);
    if (charge && charge.order_id === id) {
      const paid = charge.status === 'CAPTURED';
      if (paid && order.payment_status !== 'paid') {
        await admin
          .from('orders')
          .update({ payment_status: 'paid', status: 'placed' })
          .eq('id', id);
        await admin.from('order_status_history').insert({
          order_id: id,
          status: 'placed',
          notes: 'Payment confirmed on return',
        });
      } else if (!paid && charge.status !== 'INITIATED') {
        await admin
          .from('orders')
          .update({ payment_status: 'failed', status: 'failed' })
          .eq('id', id);
      }
    }
  }

  redirect(`/orders/${id}/track`);
}
