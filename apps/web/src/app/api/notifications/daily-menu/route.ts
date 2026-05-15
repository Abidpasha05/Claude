// Cron endpoint: publishes today's daily menu and queues push notifications to followers.
// In production: protect with a CRON_SECRET header, and wire to Expo push or a transactional provider.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: menus } = await admin
    .from('daily_menus')
    .select('id, restaurant_id, title, restaurants(name, name_ar)')
    .eq('menu_date', today)
    .eq('is_published', true);

  if (!menus?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const menu of menus) {
    const { data: followers } = await admin
      .from('restaurant_followers')
      .select('customer_id')
      .eq('restaurant_id', menu.restaurant_id)
      .eq('daily_menu_notifications', true);

    if (!followers?.length) continue;

    const rows = followers.map((f) => ({
      user_id: f.customer_id,
      restaurant_id: menu.restaurant_id,
      kind: 'daily_menu' as const,
      channel: 'push' as const,
      title: `Today's menu at ${(menu as any).restaurants?.name ?? 'your restaurant'}`,
      body: menu.title ?? "See what's cooking today.",
      data: { restaurant_id: menu.restaurant_id, menu_id: menu.id },
      sent_at: new Date().toISOString(),
    }));

    await admin.from('notifications').insert(rows);
    sent += rows.length;
    // TODO: dispatch to Expo Push / FCM / OneSignal here.
  }

  return NextResponse.json({ sent });
}
