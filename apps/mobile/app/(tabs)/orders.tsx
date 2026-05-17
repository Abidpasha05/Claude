import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatMoney } from '@arkan/shared';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, order_type, status, grand_total, currency, created_at, restaurants(name)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setOrders(data ?? []);
    })();
  }, []);

  if (signedIn === false) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Sign in to see orders</Text>
        <Link href="/sign-in" asChild>
          <Pressable style={{ backgroundColor: '#ea580c', padding: 14, borderRadius: 8, marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <FlatList
      data={orders ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <Link href={`/order/${item.id}`} asChild>
          <Pressable style={{ backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600' }}>{item.restaurants?.name ?? 'Order'}</Text>
              <Text style={{ color: '#ea580c', fontWeight: '600' }}>
                {formatMoney(item.grand_total, item.currency)}
              </Text>
            </View>
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              {item.order_number} · {item.order_type} · {item.status}
            </Text>
            <Text style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </Pressable>
        </Link>
      )}
      ListEmptyComponent={
        <Text style={{ textAlign: 'center', color: '#999', marginTop: 40 }}>
          No orders yet.
        </Text>
      }
    />
  );
}
