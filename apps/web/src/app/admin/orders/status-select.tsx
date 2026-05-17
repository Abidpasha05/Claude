'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUSES = [
  'placed', 'confirmed', 'preparing',
  'ready_for_pickup', 'out_for_delivery',
  'completed', 'canceled',
] as const;

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        start(async () => {
          const supabase = createClient();
          await supabase
            .from('orders')
            .update({
              status: next,
              completed_at: next === 'completed' ? new Date().toISOString() : null,
            })
            .eq('id', orderId);
          await supabase.from('order_status_history').insert({ order_id: orderId, status: next });

          // Fire-and-forget push notification to the customer. Don't block UI on it.
          fetch('/api/notifications/order-update', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ order_id: orderId }),
          }).catch(() => {});

          // Generate the ZATCA-compliant invoice on completion (idempotent).
          if (next === 'completed') {
            fetch(`/api/zatca/generate/${orderId}`, { method: 'POST' }).catch(() => {});
          }

          router.refresh();
        });
      }}
      className="input text-sm py-1"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
      ))}
    </select>
  );
}
