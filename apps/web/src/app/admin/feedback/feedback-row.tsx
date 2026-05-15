'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function FeedbackRow({ feedback }: any) {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  async function respond() {
    if (!reply.trim()) return;
    setBusy(true);
    await supabase.from('feedback_responses').insert({
      feedback_id: feedback.id,
      body: reply,
    });
    await supabase.from('feedback').update({ status: 'responded' }).eq('id', feedback.id);
    setReply('');
    router.refresh();
    setBusy(false);
  }

  async function setStatus(s: string) {
    await supabase.from('feedback').update({ status: s, resolved_at: s === 'resolved' ? new Date().toISOString() : null }).eq('id', feedback.id);
    router.refresh();
  }

  const typeColor = {
    complaint: 'bg-red-100 text-red-700',
    suggestion: 'bg-blue-100 text-blue-700',
    compliment: 'bg-green-100 text-green-700',
    bug: 'bg-amber-100 text-amber-700',
  }[feedback.feedback_type as string] ?? 'bg-neutral-100';

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`badge ${typeColor}`}>{feedback.feedback_type}</span>
          {feedback.rating && <span className="ml-2 text-sm text-yellow-600">{'★'.repeat(feedback.rating)}</span>}
          {feedback.subject && <h3 className="font-semibold mt-1">{feedback.subject}</h3>}
          <p className="text-sm text-neutral-600 mt-1">{feedback.body}</p>
          <p className="text-xs text-neutral-400 mt-2">
            {feedback.contact_name ?? 'Anonymous'} · {new Date(feedback.created_at).toLocaleString()}
          </p>
        </div>
        <select className="input text-sm py-1 w-32" value={feedback.status} onChange={(e) => setStatus(e.target.value)}>
          {['open', 'in_review', 'responded', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {feedback.feedback_responses?.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-neutral-200 space-y-2">
          {feedback.feedback_responses.map((r: any) => (
            <div key={r.id} className="text-sm">
              <p>{r.body}</p>
              <p className="text-xs text-neutral-400">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input className="input flex-1" placeholder="Reply to customer…" value={reply} onChange={(e) => setReply(e.target.value)} />
        <button disabled={busy} onClick={respond} className="btn-primary">Reply</button>
      </div>
    </div>
  );
}
