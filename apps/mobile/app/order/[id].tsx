import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@arkan/shared';

const DELIVERY_FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'completed'];
const TAKEAWAY_FLOW = ['placed', 'confirmed', 'preparing', 'ready_for_pickup', 'completed'];

const LABELS: Record<string, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  completed: 'Completed',
  pending_payment: 'Awaiting payment',
  canceled: 'Canceled',
  failed: 'Failed',
};

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: h }] = await Promise.all([
        supabase.from('orders').select('*, order_items(*), restaurants(name, slug)').eq('id', id).single(),
        supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at'),
      ]);
      setOrder(o);
      setHistory(h ?? []);
    })();

    const channel = supabase
      .channel(`order:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => setOrder((o: any) => ({ ...o, ...payload.new }))
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${id}` },
        (payload) => setHistory((h) => [...h, payload.new])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const flow = useMemo(
    () => (order?.order_type === 'delivery' ? DELIVERY_FLOW : TAKEAWAY_FLOW),
    [order?.order_type]
  );
  const currentIdx = order ? flow.indexOf(order.status) : -1;

  if (!order) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const isPending = order.status === 'pending_payment';
  const isFailed = order.status === 'failed' || order.status === 'canceled';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={card}>
        <Text style={{ fontSize: 14, color: '#666' }}>{order.restaurants?.name}</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 4 }}>Order {order.order_number}</Text>
        {order.slot_start && (
          <Text style={{ color: '#666', marginTop: 8 }}>
            {order.order_type === 'delivery' ? 'Delivery' : 'Pickup'} window:{' '}
            <Text style={{ fontWeight: '600' }}>{new Date(order.slot_start).toLocaleString()}</Text>
          </Text>
        )}
      </View>

      {isPending && (
        <View style={{ ...card, backgroundColor: '#fef3c7' }}>
          <Text style={{ color: '#92400e', fontWeight: '600' }}>Waiting for payment to confirm…</Text>
          <Text style={{ color: '#92400e', marginTop: 4 }}>This screen will update automatically.</Text>
        </View>
      )}

      {isFailed ? (
        <View style={card}>
          <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            Order {LABELS[order.status]}
          </Text>
          {order.cancellation_reason && (
            <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>{order.cancellation_reason}</Text>
          )}
        </View>
      ) : (
        <View style={card}>
          <Text style={{ fontWeight: '700', marginBottom: 12 }}>Progress</Text>
          {flow.map((step, i) => {
            const passed = currentIdx >= i;
            const current = currentIdx === i;
            const entry = history.find((h) => h.status === step);
            return (
              <View key={step} style={{ flexDirection: 'row', paddingVertical: 8 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: passed ? '#ea580c' : '#e5e5e5',
                    borderWidth: current ? 3 : 0,
                    borderColor: '#fed7aa',
                    marginRight: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>{passed ? '✓' : ''}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: passed ? '600' : '400', color: passed ? '#111' : '#999' }}>
                    {LABELS[step]}
                  </Text>
                  {entry && (
                    <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
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
        <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
          {order.payment_method?.replace('_', ' ')} · {order.payment_status}
        </Text>
      </View>
    </ScrollView>
  );
}

const card = {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};
