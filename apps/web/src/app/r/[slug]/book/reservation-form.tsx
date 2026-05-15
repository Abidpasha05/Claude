'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Branch { id: string; name: string; address: string; city: string | null }
interface Item { id: string; name: string; price: number; currency: string }

export function ReservationForm({
  restaurantId,
  branches,
  menuItems,
}: { restaurantId: string; branches: Branch[]; menuItems: Item[] }) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [arrival, setArrival] = useState('');
  const [size, setSize] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [preOrder, setPreOrder] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setQty(itemId: string, qty: number) {
    setPreOrder((p) => {
      const next = { ...p };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = qty;
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          branch_id: branchId,
          arrival_time: new Date(arrival).toISOString(),
          party_size: Number(size),
          guest_name: name || undefined,
          guest_phone: phone || undefined,
          notes: notes || undefined,
          linked_order_items: Object.entries(preOrder).map(([menu_item_id, quantity]) => ({
            menu_item_id,
            quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Booking failed');
      router.push(`/reservations/${json.reservation.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div>
        <label className="text-sm font-medium">Location</label>
        <select className="input mt-1" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Arrival time</label>
          <input type="datetime-local" className="input mt-1" value={arrival} onChange={(e) => setArrival(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-medium">Party size</label>
          <input type="number" min={1} max={50} className="input mt-1" value={size} onChange={(e) => setSize(Number(e.target.value))} required />
        </div>
      </div>
      <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <textarea className="input" rows={2} placeholder="Special requests" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <details className="border rounded-lg p-3">
        <summary className="cursor-pointer font-medium">Pre-order from menu (optional)</summary>
        <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
          {menuItems.map((it) => (
            <div key={it.id} className="flex items-center justify-between">
              <span className="text-sm">{it.name}</span>
              <input
                type="number"
                min={0}
                className="input w-20"
                value={preOrder[it.id] ?? 0}
                onChange={(e) => setQty(it.id, Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </details>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Booking…' : 'Confirm reservation'}
      </button>
    </form>
  );
}
