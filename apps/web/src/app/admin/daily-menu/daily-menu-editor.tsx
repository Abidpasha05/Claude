'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DailyMenuEditor({ restaurantId, items, dailies }: any) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function publish() {
    setBusy(true);
    const { data: menu } = await supabase
      .from('daily_menus')
      .upsert({ restaurant_id: restaurantId, menu_date: date, title, is_published: true }, { onConflict: 'restaurant_id,menu_date' })
      .select()
      .single();

    if (menu) {
      await supabase.from('daily_menu_items').delete().eq('daily_menu_id', menu.id);
      const rows = Array.from(selected).map((menu_item_id, i) => ({
        daily_menu_id: menu.id,
        menu_item_id,
        sort_order: i,
      }));
      if (rows.length) await supabase.from('daily_menu_items').insert(rows);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">New / update daily menu</h2>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" placeholder="Title (e.g., Friday Family Feast)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <p className="text-sm font-medium mb-2">Items ({selected.size} selected)</p>
          <div className="max-h-72 overflow-y-auto border rounded-lg p-2 space-y-1">
            {items.map((it: any) => (
              <label key={it.id} className="flex items-center gap-2 text-sm hover:bg-neutral-50 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={selected.has(it.id)}
                  onChange={() => {
                    const n = new Set(selected);
                    n.has(it.id) ? n.delete(it.id) : n.add(it.id);
                    setSelected(n);
                  }}
                />
                <span>{it.name}</span>
              </label>
            ))}
          </div>
        </div>
        <button disabled={busy || selected.size === 0} onClick={publish} className="btn-primary w-full">
          {busy ? 'Publishing…' : 'Publish & notify followers'}
        </button>
      </div>

      <div>
        <h2 className="font-semibold mb-3">Upcoming daily menus</h2>
        <div className="space-y-2">
          {dailies.map((d: any) => (
            <div key={d.id} className="card p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{d.menu_date}</p>
                  <p className="text-sm text-neutral-600">{d.title}</p>
                </div>
                <span className={`badge ${d.is_published ? 'bg-green-100 text-green-700' : 'bg-neutral-100'}`}>
                  {d.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-2">{d.daily_menu_items?.length ?? 0} items</p>
            </div>
          ))}
          {!dailies.length && <p className="text-sm text-neutral-500">None yet.</p>}
        </div>
      </div>
    </div>
  );
}
