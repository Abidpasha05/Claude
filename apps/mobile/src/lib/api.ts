import Constants from 'expo-constants';
import { supabase } from './supabase';

// Single base URL for all REST calls. Set EXPO_PUBLIC_API_URL to your deployed
// Next.js app (e.g. https://tablebite.app). For local dev pointing at a
// laptop, use your machine's LAN IP, e.g. http://192.168.1.10:3000.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as any)?.apiUrl ??
  'http://localhost:3000';

export async function api<T = any>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init.headers as any),
  };

  if (init.auth !== false) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}
