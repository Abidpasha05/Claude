'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function PromotionsManager({ restaurantId, promotions }: any) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  async function toggle(id: string, active: boolean) {
    const supabase = createClient();
    await supabase.from('promotions').update({ is_active: !active }).eq('id', id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowNew(true)} className="btn-primary">+ New promotion</button>
      </div>
      {showNew && <NewPromoDialog restaurantId={restaurantId} onClose={() => { setShowNew(false); router.refresh(); }} />}
      <div className="grid md:grid-cols-2 gap-4">
        {promotions.map((p: any) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge bg-brand-100 text-brand-700">{p.promotion_type}</span>
                <h3 className="font-semibold mt-2">{p.title}</h3>
                {p.code && <p className="text-sm font-mono text-neutral-600">{p.code}</p>}
              </div>
              <button onClick={() => toggle(p.id, p.is_active)} className="text-sm underline">
                {p.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
            <p className="text-sm text-neutral-600 mt-2">{p.description}</p>
            {p.daily_start_time && (
              <p className="text-xs text-neutral-500 mt-2">
                Daily {p.daily_start_time.slice(0,5)} – {p.daily_end_time.slice(0,5)}
              </p>
            )}
            <p className="text-xs text-neutral-500 mt-1">Used {p.times_used} times</p>
          </div>
        ))}
        {!promotions.length && <div className="card p-10 text-center text-neutral-500 col-span-2">No promotions yet.</div>}
      </div>
    </div>
  );
}

function NewPromoDialog({ restaurantId, onClose }: any) {
  const [f, setF] = useState({
    title: '', code: '', promotion_type: 'percentage', discount_value: '10',
    daily_start_time: '', daily_end_time: '', description: '',
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from('promotions').insert({
      restaurant_id: restaurantId,
      title: f.title,
      code: f.code || null,
      promotion_type: f.promotion_type,
      discount_value: Number(f.discount_value),
      daily_start_time: f.daily_start_time || null,
      daily_end_time: f.daily_end_time || null,
      description: f.description || null,
      is_active: true,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md space-y-3">
        <h2 className="font-semibold">New promotion</h2>
        <input className="input" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input" placeholder="Code (optional)" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <select className="input" value={f.promotion_type} onChange={(e) => setF({ ...f, promotion_type: e.target.value })}>
          <option value="percentage">Percentage off</option>
          <option value="fixed_amount">Fixed amount off</option>
          <option value="free_delivery">Free delivery</option>
          <option value="happy_hour">Happy hour</option>
          <option value="closing_hour">Closing hour</option>
        </select>
        <input className="input" type="number" placeholder="Discount value" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="time" placeholder="Daily start" value={f.daily_start_time} onChange={(e) => setF({ ...f, daily_start_time: e.target.value })} />
          <input className="input" type="time" placeholder="Daily end" value={f.daily_end_time} onChange={(e) => setF({ ...f, daily_end_time: e.target.value })} />
        </div>
        <textarea className="input" rows={2} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={save} disabled={busy || !f.title} className="btn-primary flex-1">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
