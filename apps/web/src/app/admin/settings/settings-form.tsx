'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SettingsForm({ restaurant }: any) {
  const router = useRouter();
  const [f, setF] = useState({
    name: restaurant.name ?? '',
    description: restaurant.description ?? '',
    base_delivery_fee: restaurant.base_delivery_fee ?? 0,
    min_order_amount: restaurant.min_order_amount ?? 0,
    preparation_time_minutes: restaurant.preparation_time_minutes ?? 30,
    delivery_enabled: restaurant.delivery_enabled,
    takeaway_enabled: restaurant.takeaway_enabled,
    dine_in_enabled: restaurant.dine_in_enabled,
    party_orders_enabled: restaurant.party_orders_enabled,
    subscriptions_enabled: restaurant.subscriptions_enabled,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from('restaurants').update(f).eq('id', restaurant.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Restaurant</h2>
        <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm">Base delivery fee</label>
            <input type="number" step="0.01" className="input" value={f.base_delivery_fee} onChange={(e) => setF({ ...f, base_delivery_fee: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm">Min order amount</label>
            <input type="number" step="0.01" className="input" value={f.min_order_amount} onChange={(e) => setF({ ...f, min_order_amount: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="text-sm">Prep time (minutes)</label>
          <input type="number" className="input" value={f.preparation_time_minutes} onChange={(e) => setF({ ...f, preparation_time_minutes: Number(e.target.value) })} />
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Service channels</h2>
        {([
          ['delivery_enabled', 'Delivery'],
          ['takeaway_enabled', 'Takeaway'],
          ['dine_in_enabled', 'Dine-in & reservations'],
          ['party_orders_enabled', 'Party orders'],
          ['subscriptions_enabled', 'Meal subscriptions'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(f as any)[key]}
              onChange={(e) => setF({ ...f, [key]: e.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </section>

      <div className="md:col-span-2">
        <button onClick={save} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </div>
  );
}
