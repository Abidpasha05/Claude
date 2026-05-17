// Cron endpoint: publishes today's daily menu and dispatches push notifications
// to followers via Expo Push. Run once a day, e.g. from Vercel Cron or
// Supabase pg_cron.
//
// Protect with CRON_SECRET — the request must include the matching
// x-cron-secret header.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendExpoPush } from '@/lib/notifications/expo-push';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: menus } = await admin
    .from('daily_menus')
    .select('id, restaurant_id, title, restaurants(name, name_ar, slug)')
    .eq('menu_date', today)
    .eq('is_published', true);

  if (!menus?.length) return NextResponse.json({ menus: 0, recipients: 0, sent: 0 });

  let queued = 0;
  let pushed = 0;

  for (const menu of menus) {
    const restaurant = (menu as any).restaurants;
    const { data: followers } = await admin
      .from('restaurant_followers')
      .select('customer_id')
      .eq('restaurant_id', menu.restaurant_id)
      .eq('daily_menu_notifications', true);

    if (!followers?.length) continue;

    const userIds = followers.map((f) => f.customer_id);

    // Insert in-app notification rows (the bell icon in the app).
    const notifRows = userIds.map((user_id) => ({
      user_id,
      restaurant_id: menu.restaurant_id,
      kind: 'daily_menu' as const,
      channel: 'push' as const,
      title: `Today's menu at ${restaurant?.name ?? 'your restaurant'}`,
      body: menu.title ?? "See what's cooking today.",
      data: {
        restaurant_id: menu.restaurant_id,
        restaurant_slug: restaurant?.slug,
        menu_id: menu.id,
      },
      sent_at: new Date().toISOString(),
    }));
    await admin.from('notifications').insert(notifRows);
    queued += notifRows.length;

    // Dispatch via Expo Push. Each user may have multiple active devices.
    const { data: tokens } = await admin
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (!tokens?.length) continue;

    const tickets = await sendExpoPush(
      tokens.map((t) => ({
        to: t.token,
        title: `Today at ${restaurant?.name ?? 'your restaurant'}`,
        body: menu.title ?? "See what's cooking today.",
        data: {
          restaurant_id: menu.restaurant_id,
          restaurant_slug: restaurant?.slug,
          menu_id: menu.id,
          kind: 'daily_menu',
        },
        sound: 'default',
        channelId: 'default',
        priority: 'high',
      }))
    );
    pushed += tickets.filter((t) => t.status === 'ok').length;
  }

  return NextResponse.json({ menus: menus.length, queued, pushed });
}

// Allow GET so Vercel Cron can hit it with a simple schedule.
export const GET = POST;
