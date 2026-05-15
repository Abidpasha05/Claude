'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-neutral-600 mb-6">We'll email you a magic link.</p>
        {sent ? (
          <p className="text-green-700">Check your inbox for the sign-in link.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <input type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button disabled={submitting} className="btn-primary w-full">{submitting ? 'Sending…' : 'Send magic link'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
