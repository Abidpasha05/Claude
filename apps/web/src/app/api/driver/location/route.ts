// Driver app posts location pings (every ~10s while on a delivery).
// Updates both the live snapshot on driver_profiles and an append-only
// history row on driver_locations (the latter so the customer can render
// a trail).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { latitude, longitude, heading, speed, order_id, status } = body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'Invalid coords' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Promise.all([
    supabase.from('driver_locations').insert({
      driver_id: user.id,
      order_id: order_id ?? null,
      latitude,
      longitude,
      heading,
      speed,
    }),
    supabase
      .from('driver_profiles')
      .upsert(
        {
          user_id: user.id,
          current_latitude: latitude,
          current_longitude: longitude,
          last_seen_at: new Date().toISOString(),
          ...(status ? { status } : {}),
        },
        { onConflict: 'user_id' }
      ),
  ]);

  return NextResponse.json({ ok: true });
}
