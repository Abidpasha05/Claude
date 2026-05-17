'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function InviteDriver({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      setError('No Arkan account found with that email. Ask the driver to sign up first.');
      setBusy(false);
      return;
    }

    const { error: linkErr } = await supabase
      .from('restaurant_members')
      .insert({ restaurant_id: restaurantId, user_id: profile.id, role: 'driver', is_active: true });
    if (linkErr) {
      setError(linkErr.message);
      setBusy(false);
      return;
    }

    await supabase
      .from('driver_profiles')
      .upsert({ user_id: profile.id, status: 'offline' }, { onConflict: 'user_id' });

    setOpen(false);
    setEmail('');
    setBusy(false);
    router.refresh();
  }

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>+ Add driver</button>;
  }

  return (
    <div className="card p-4 w-80 space-y-2">
      <h3 className="font-semibold">Link a driver</h3>
      <input
        className="input"
        type="email"
        placeholder="driver@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn-primary flex-1" disabled={!email || busy} onClick={invite}>
          {busy ? 'Linking…' : 'Link'}
        </button>
      </div>
    </div>
  );
}
