'use client';

import { useState } from 'react';

export function PartyOrderForm({ restaurantId }: { restaurantId: string }) {
  const [form, setForm] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    event_name: '',
    event_date: '',
    guest_count: 30,
    service_type: 'drop-off',
    venue_address: '',
    special_requests: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function up<K extends keyof typeof form>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/party-orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          ...form,
          event_date: new Date(form.event_date).toISOString(),
          guest_count: Number(form.guest_count),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submission failed');
      setDone(json.party.party_number);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Inquiry received</h2>
        <p className="text-neutral-600 mb-1">Your reference number is</p>
        <p className="text-2xl font-mono">{done}</p>
        <p className="text-sm text-neutral-500 mt-4">
          The restaurant will contact you within 24 hours with a quote.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <input required className="input" placeholder="Your name" value={form.contact_name} onChange={(e) => up('contact_name', e.target.value)} />
        <input required className="input" placeholder="Phone" value={form.contact_phone} onChange={(e) => up('contact_phone', e.target.value)} />
        <input className="input" type="email" placeholder="Email (optional)" value={form.contact_email} onChange={(e) => up('contact_email', e.target.value)} />
        <input className="input" placeholder="Event name (optional)" value={form.event_name} onChange={(e) => up('event_name', e.target.value)} />
        <input required className="input" type="datetime-local" value={form.event_date} onChange={(e) => up('event_date', e.target.value)} />
        <input required className="input" type="number" min={10} placeholder="Guest count" value={form.guest_count} onChange={(e) => up('guest_count', e.target.value)} />
      </div>
      <select className="input" value={form.service_type} onChange={(e) => up('service_type', e.target.value)}>
        <option value="drop-off">Drop-off catering</option>
        <option value="buffet">Buffet setup</option>
        <option value="plated">Plated service</option>
        <option value="staff-included">Full service with staff</option>
      </select>
      <textarea className="input" rows={2} placeholder="Venue address" value={form.venue_address} onChange={(e) => up('venue_address', e.target.value)} />
      <textarea className="input" rows={3} placeholder="Special requests, dietary requirements, menu preferences…" value={form.special_requests} onChange={(e) => up('special_requests', e.target.value)} />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting…' : 'Submit inquiry'}
      </button>
    </form>
  );
}
