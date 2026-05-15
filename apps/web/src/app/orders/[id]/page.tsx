import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatMoney } from '@restaurant-saas/shared';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await createAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*), restaurants(name, slug)')
    .eq('id', id)
    .single();

  if (!order) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl mb-3">✓</div>
          <h1 className="text-2xl font-bold">Order placed</h1>
          <p className="text-neutral-600">Order #{order.order_number}</p>
        </div>

        <div className="border-t pt-4 space-y-1 text-sm">
          <Row label="Restaurant" value={(order as any).restaurants?.name ?? ''} />
          <Row label="Type" value={order.order_type} />
          <Row label="Status" value={order.status} />
          {order.slot_start && (
            <Row label={order.order_type === 'delivery' ? 'Delivery time' : 'Pickup time'} value={new Date(order.slot_start).toLocaleString()} />
          )}
          <Row label="Payment" value={`${order.payment_method} · ${order.payment_status}`} />
        </div>

        <div className="border-t mt-4 pt-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="text-sm space-y-1">
            {(order as any).order_items?.map((it: any) => (
              <li key={it.id} className="flex justify-between">
                <span>{it.quantity}× {it.name_snapshot}</span>
                <span>{formatMoney(it.line_total, order.currency)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(order.grand_total, order.currency)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-neutral-500">{label}</span><span className="capitalize">{value}</span></div>
  );
}
