// Expo Push Notification dispatcher.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
//
// We POST tokens in batches of 100 (Expo's hard limit per request), retry on
// transient errors, and deactivate tokens that come back DeviceNotRegistered.

import { createAdminClient } from '@/lib/supabase/server';

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
}

interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoTicket[]> {
  if (!messages.length) return [];

  const tickets: ExpoTicket[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'accept-encoding': 'gzip, deflate',
        ...(process.env.EXPO_PUSH_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_PUSH_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      // Mark everything in this batch as errored — caller decides whether to retry.
      const text = await res.text();
      console.error('Expo push batch failed', res.status, text);
      for (const _ of batch) tickets.push({ status: 'error', message: `HTTP ${res.status}` });
      continue;
    }

    const json = await res.json();
    if (Array.isArray(json.data)) tickets.push(...json.data);
  }

  // Deactivate tokens reported as unregistered so we stop sending to them.
  const dead: string[] = [];
  tickets.forEach((t, i) => {
    if (t.status === 'error' && t.details?.error === 'DeviceNotRegistered') {
      dead.push(messages[i].to);
    }
  });
  if (dead.length) {
    const admin = await createAdminClient();
    await admin.from('push_tokens').update({ is_active: false }).in('token', dead);
  }

  return tickets;
}

/**
 * Convenience: send the same push to one user, fanning out across any active
 * tokens (multi-device). Used by order-update notifications.
 */
export async function sendPushToUser(
  user_id: string,
  payload: Omit<ExpoPushMessage, 'to'>
) {
  const admin = await createAdminClient();
  const { data: tokens } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', user_id)
    .eq('is_active', true);

  if (!tokens?.length) return [];
  return sendExpoPush(tokens.map((t) => ({ ...payload, to: t.token })));
}
