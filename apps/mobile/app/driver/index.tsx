import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@arkan/shared';

type Lists = { available: any[]; active: any[] };

export default function DriverHome() {
  const [data, setData] = useState<Lists | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<'offline' | 'online' | 'on_delivery' | 'on_break'>('offline');

  const load = useCallback(async () => {
    try {
      const json = await api<Lists>('/api/driver/available');
      setData(json);
    } catch (e: any) {
      Alert.alert('Failed to load', e.message);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('driver_profiles').select('status').eq('user_id', user.id).single();
      if (p?.status) setStatus(p.status as any);
    })();
  }, [load]);

  async function toggleOnline() {
    const next = status === 'online' || status === 'on_delivery' ? 'offline' : 'online';
    setStatus(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('driver_profiles').upsert(
      { user_id: user.id, status: next, last_seen_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  async function accept(order_id: string) {
    try {
      await api('/api/driver/accept', { method: 'POST', body: JSON.stringify({ order_id }) });
      await load();
    } catch (e: any) {
      Alert.alert('Could not accept', e.message);
    }
  }

  if (!data) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fafafa' }}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(true); await load(); setRefreshing(false);
      }} />}
    >
      <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 12, color: '#666' }}>Your status</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', textTransform: 'capitalize' }}>
              {status.replace('_', ' ')}
            </Text>
          </View>
          <Pressable
            onPress={toggleOnline}
            style={{
              backgroundColor: status === 'online' || status === 'on_delivery' ? '#16a34a' : '#9ca3af',
              paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>
              {status === 'online' || status === 'on_delivery' ? 'Go offline' : 'Go online'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Section title={`Active (${data.active.length})`}>
        {data.active.length === 0 && (
          <Empty text="No active deliveries." />
        )}
        {data.active.map((o) => (
          <Link key={o.id} href={`/driver/order/${o.id}`} asChild>
            <Pressable style={card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700' }}>{o.restaurants?.name}</Text>
                <Text style={{ color: '#ea580c', fontWeight: '700' }}>{formatMoney(o.grand_total, o.currency)}</Text>
              </View>
              <Text style={{ color: '#666', marginTop: 4 }}>
                #{o.order_number} · {o.status?.replace('_', ' ')}
              </Text>
              {o.delivery_address_snapshot?.address && (
                <Text style={{ color: '#333', marginTop: 6 }} numberOfLines={2}>
                  → {o.delivery_address_snapshot.address}
                </Text>
              )}
            </Pressable>
          </Link>
        ))}
      </Section>

      <Section title={`Available (${data.available.length})`}>
        {data.available.length === 0 && <Empty text="Nothing to claim right now." />}
        {data.available.map((o) => (
          <View key={o.id} style={card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{o.restaurants?.name}</Text>
              <Text style={{ color: '#ea580c', fontWeight: '700' }}>{formatMoney(o.grand_total, o.currency)}</Text>
            </View>
            <Text style={{ color: '#666', marginTop: 4 }}>#{o.order_number}</Text>
            {o.delivery_address_snapshot?.address && (
              <Text style={{ color: '#333', marginTop: 6 }} numberOfLines={2}>
                → {o.delivery_address_snapshot.address}
              </Text>
            )}
            <Pressable
              onPress={() => accept(o.id)}
              style={{ backgroundColor: '#0f172a', padding: 12, borderRadius: 10, marginTop: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Accept</Text>
            </Pressable>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontWeight: '700', marginBottom: 8, color: '#0f172a' }}>{title}</Text>
      {children}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={{ ...card, alignItems: 'center', paddingVertical: 24 }}>
      <Text style={{ color: '#999' }}>{text}</Text>
    </View>
  );
}

const card = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 14,
  marginBottom: 8,
};
