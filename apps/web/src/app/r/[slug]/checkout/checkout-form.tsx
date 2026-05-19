'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { computePricing, formatMoney, generateSlots, formatSlot } from '@aklio/shared';
import type { PaymentMethod } from '@aklio/shared';

interface Props {
  restaurant: {
    id: string;
    name: string;
    currency: string;
    delivery_enabled: boolean;
    takeaway_enabled: boolean;
    base_delivery_fee: number;
    preparation_time_minutes: number;
  };
  slug: string;
}

export function CheckoutForm({ restaurant, slug }: Props) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway'>(
    restaurant.takeaway_enabled ? 'takeaway' : 'delivery'
  );
  const [slotIso, setSlotIso] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = useMemo(
    () =>
      generateSlots(new Date(), {
        open_time: '10:00',
        close_time: '23:00',
        slot_duration_minutes: 30,
        prep_minutes: restaurant.preparation_time_minutes,
      }).slice(0, 20),
    [restaurant.preparation_time_minutes]
  );

  const pricing = computePricing({
    lines,
    delivery_fee: orderType === 'delivery' ? Number(restaurant.base_delivery_fee) : 0,
    tax_rate: 0.15,
  });

  if (lines.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-neutral-600">Your cart is empty.</p>
        <a href={`/r/${slug}`} className="btn-primary mt-4 inline-flex">Browse menu</a>
      </div>
    );
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const slot = slots.find((s) => s.start === slotIso);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          order_type: orderType,
          items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
          slot_start: slot?.start,
          slot_end: slot?.end,
          payment_method: paymentMethod,
          guest_name: name || undefined,
          guest_phone: phone || undefined,
          delivery_address: orderType === 'delivery' ? address : undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Order failed');
      clear();
      if (json.redirect_url) {
        // Card / Mada / STC Pay → Tap-hosted checkout
        window.location.href = json.redirect_url;
      } else {
        // Cash → straight to live tracking
        router.push(`/orders/${json.order.id}/track`);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <section className="card p-5">
          <h2 className="font-semibold mb-3">Order type</h2>
          <div className="flex gap-2">
            {restaurant.takeaway_enabled && (
              <button
                onClick={() => setOrderType('takeaway')}
                className={orderType === 'takeaway' ? 'btn-primary' : 'btn-secondary'}
              >
                Takeaway
              </button>
            )}
            {restaurant.delivery_enabled && (
              <button
                onClick={() => setOrderType('delivery')}
                className={orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'}
              >
                Delivery
              </button>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">
            {orderType === 'delivery' ? 'Delivery time' : 'Pickup time'}
          </h2>
          <select className="input" value={slotIso} onChange={(e) => setSlotIso(e.target.value)}>
            <option value="">Select a slot</option>
            {slots.map((s) => (
              <option key={s.start} value={s.start}>
                {formatSlot(s)}
              </option>
            ))}
          </select>
        </section>

        <section className="card p-5 space-y-3">
          <h2 className="font-semibold">Contact</h2>
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Phone (e.g. +9665...)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {orderType === 'delivery' && (
            <textarea
              className="input"
              placeholder="Delivery address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          )}
          <textarea
            className="input"
            placeholder="Order notes (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>

        <section className="card p-5">
          <h2 className="font-semibold mb-3">Payment method</h2>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'card', 'stc_pay'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={paymentMethod === m ? 'btn-primary' : 'btn-secondary'}
              >
                {m === 'cash' ? 'Cash' : m === 'card' ? 'Card' : 'STC Pay'}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Card and STC Pay route to Tap/HyperPay in production.
          </p>
        </section>
      </div>

      <aside className="card p-5 h-fit md:sticky md:top-24">
        <h2 className="font-semibold mb-3">Summary</h2>
        <ul className="text-sm space-y-2 mb-4">
          {lines.map((l) => (
            <li key={l.menu_item_id} className="flex justify-between">
              <span>{l.quantity}× {l.name}</span>
              <span>{formatMoney(l.quantity * l.unit_price, restaurant.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-3 space-y-1 text-sm">
          <Row label="Subtotal" value={formatMoney(pricing.subtotal, restaurant.currency)} />
          <Row label="VAT (15%)" value={formatMoney(pricing.tax, restaurant.currency)} />
          {pricing.delivery_fee > 0 && (
            <Row label="Delivery" value={formatMoney(pricing.delivery_fee, restaurant.currency)} />
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatMoney(pricing.grand_total, restaurant.currency)}</span>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        <button
          onClick={submit}
          disabled={submitting || !slotIso || !phone}
          className="btn-primary w-full mt-4"
        >
          {submitting ? 'Placing…' : 'Place order'}
        </button>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}
