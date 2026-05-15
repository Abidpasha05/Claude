'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

export function FeedbackForm({ restaurantId }: { restaurantId: string }) {
  const [type, setType] = useState<'complaint' | 'suggestion' | 'compliment'>('suggestion');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [rating, setRating] = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          feedback_type: type,
          subject: subject || undefined,
          body,
          rating: rating || undefined,
          contact_name: contactName || undefined,
          contact_email: contactEmail || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Submission failed');
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-bold text-lg mb-2">Thank you</h2>
        <p className="text-neutral-600">We've received your message and will respond within 48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4">
      <div className="flex gap-2">
        {(['complaint', 'suggestion', 'compliment'] as const).map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={type === t ? 'btn-primary' : 'btn-secondary'}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium">Rating (optional)</label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)}>
              <Star className={`w-6 h-6 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}`} />
            </button>
          ))}
        </div>
      </div>
      <input className="input" placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea required minLength={5} className="input" rows={5} placeholder="Tell us what's on your mind…" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" placeholder="Your name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <input className="input" type="email" placeholder="Email (optional)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
