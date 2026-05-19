'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatMoney } from '@aklio/shared';

export function MenuEditor({ restaurantId, categories, items }: any) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  async function quickToggle(id: string, status: string) {
    const supabase = createClient();
    const next = status === 'available' ? 'out_of_stock' : 'available';
    await supabase.from('menu_items').update({ status: next }).eq('id', id);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-neutral-600">{items.length} items across {categories.length} categories</p>
        <button className="btn-primary" onClick={() => setShowNew(true)}>+ New item</button>
      </div>
      {showNew && <NewItemDialog restaurantId={restaurantId} categories={categories} onClose={() => { setShowNew(false); router.refresh(); }} />}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it: any) => (
          <div key={it.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{it.name}</h3>
                <p className="text-sm text-neutral-500">{formatMoney(it.price, it.currency)} · {it.calories ?? '—'} kcal</p>
              </div>
              <span className={`badge ${it.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {it.status}
              </span>
            </div>
            {it.description && <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{it.description}</p>}
            <button onClick={() => quickToggle(it.id, it.status)} className="btn-ghost text-sm mt-3 w-full">
              {it.status === 'available' ? 'Mark out of stock' : 'Mark available'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewItemDialog({ restaurantId, categories, onClose }: any) {
  const [f, setF] = useState({ name: '', price: '', category_id: categories[0]?.id ?? '', calories: '', description: '' });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from('menu_items').insert({
      restaurant_id: restaurantId,
      name: f.name,
      price: Number(f.price),
      currency: 'SAR',
      calories: f.calories ? Number(f.calories) : null,
      description: f.description || null,
      category_id: f.category_id,
      status: 'available',
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md space-y-3">
        <h2 className="font-semibold">New menu item</h2>
        <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className="input" type="number" step="0.01" placeholder="Price" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className="input" type="number" placeholder="Calories (optional)" value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} />
        <select className="input" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea className="input" rows={3} placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="flex gap-2 pt-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button disabled={busy || !f.name || !f.price} onClick={save} className="btn-primary flex-1">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
