import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { formatMoney } from '@restaurant-saas/shared';

// While a driver is on a delivery, stream location every ~10s.
const LOCATION_INTERVAL_MS = 10_000;

export default function DriverOrder() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*), restaurants(name, slug)')
        .eq('id', id)
        .single();
      setOrder(data);
    })();
  }, [id]);

  // Foreground location streaming when the order is in delivery.
  useEffect(() => {
    if (!order || order.status !== 'out_for_delivery') return;

    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Customers see your live ETA while you deliver.');
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: LOCATION_INTERVAL_MS, distanceInterval: 30 },
        (loc) => {
          api('/api/driver/location', {
            method: 'POST',
            body: JSON.stringify({
              order_id: id,
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading ?? undefined,
              speed: loc.coords.speed ?? undefined,
              status: 'on_delivery',
            }),
          }).catch(() => {});
        }
      );
    })();

    return () => { sub?.remove(); };
  }, [order, id]);

  if (!order) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  const phone = order.guest_phone;
  const address = order.delivery_address_snapshot?.address;
  const mapUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  async function advance(next: 'out_for_delivery' | 'completed') {
    setBusy(true);
    try {
      await api('/api/driver/status', {
        method: 'POST',
        body: JSON.stringify({ order_id: id, status: next }),
      });
      if (next === 'completed') router.replace('/driver');
      else {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
        setOrder({ ...order, ...data });
      }
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={card}>
        <Text style={{ fontSize: 14, color: '#666' }}>{order.restaurants?.name}</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 4 }}>#{order.order_number}</Text>
        <Text style={{ color: '#666', marginTop: 4, textTransform: 'capitalize' }}>{order.status?.replace('_', ' ')}</Text>
      </View>

      {address && (
        <View style={card}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Delivery address</Text>
          <Text style={{ color: '#333' }}>{address}</Text>
          {mapUrl && (
            <Pressable onPress={() => Linking.openURL(mapUrl)} style={primary}>
              <Text style={primaryText}>Open in Maps</Text>
            </Pressable>
          )}
        </View>
      )}

      {phone && (
        <View style={card}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Customer</Text>
          <Text style={{ color: '#333' }}>{order.guest_name ?? '—'}</Text>
          <Text style={{ color: '#666' }}>{phone}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={[primary, { flex: 1 }]}>
              <Text style={primaryText}>Call</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(`sms:${phone}`)} style={[secondary, { flex: 1 }]}>
              <Text style={secondaryText}>Text</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={card}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Items</Text>
        {(order.order_items ?? []).map((it: any) => (
          <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
            <Text>{it.quantity}× {it.name_snapshot}</Text>
            <Text>{formatMoney(it.line_total, order.currency)}</Text>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700' }}>Total</Text>
          <Text style={{ fontWeight: '700' }}>{formatMoney(order.grand_total, order.currency)}</Text>
        </View>
        <Text style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
          {order.payment_method?.replace('_', ' ')} · {order.payment_status}
        </Text>
      </View>

      {order.status === 'ready_for_pickup' && (
        <Pressable disabled={busy} onPress={() => advance('out_for_delivery')} style={primary}>
          <Text style={primaryText}>{busy ? 'Updating…' : "I've picked it up"}</Text>
        </Pressable>
      )}
      {order.status === 'out_for_delivery' && (
        <Pressable disabled={busy} onPress={() => advance('completed')} style={[primary, { backgroundColor: '#16a34a' }]}>
          <Text style={primaryText}>{busy ? 'Updating…' : 'Mark delivered'}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const card = { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12 };
const primary = { backgroundColor: '#0f172a', padding: 14, borderRadius: 10, marginTop: 8 };
const primaryText = { color: 'white', textAlign: 'center' as const, fontWeight: '700' as const };
const secondary = { backgroundColor: '#e2e8f0', padding: 14, borderRadius: 10 };
const secondaryText = { color: '#0f172a', textAlign: 'center' as const, fontWeight: '700' as const };
