import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@aklio/shared';
import { OrderStatusSelect } from './status-select';

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase
    .from('restaurant_members')
    .select('restaurant_id')
    .eq('user_id', user!.id)
    .limit(1)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, order_type, status, grand_total, currency, payment_method, payment_status, created_at, slot_start, guest_name, guest_phone')
    .eq('restaurant_id', m!.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-100">
            <tr className="text-left">
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3 font-mono">{o.order_number}</td>
                <td className="px-4 py-3 capitalize">{o.order_type}</td>
                <td className="px-4 py-3">{o.guest_name ?? '—'}<br /><span className="text-xs text-neutral-500">{o.guest_phone}</span></td>
                <td className="px-4 py-3">{o.slot_start ? new Date(o.slot_start).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">{formatMoney(o.grand_total, o.currency)}</td>
                <td className="px-4 py-3 capitalize">{o.payment_method} · {o.payment_status}</td>
                <td className="px-4 py-3"><OrderStatusSelect orderId={o.id} status={o.status} /></td>
              </tr>
            ))}
            {!orders?.length && (
              <tr><td colSpan={7} className="p-10 text-center text-neutral-500">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
