import { FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useCart } from '@/lib/cart-store';
import { formatMoney } from '@arkan/shared';

export default function CartScreen() {
  const router = useRouter();
  const { lines, restaurant_name, restaurant_currency, setQty, remove, subtotal, clear } = useCart();

  if (!lines.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Your cart is empty</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#f59e0b' }}>Browse menu</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, backgroundColor: 'white' }}>
        <Text style={{ fontSize: 12, color: '#666' }}>Ordering from</Text>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{restaurant_name}</Text>
      </View>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.menu_item_id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: '#666', marginTop: 2 }}>
                {formatMoney(item.unit_price * item.quantity, restaurant_currency)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={() => setQty(item.menu_item_id, item.quantity - 1)} style={btn}>
                <Text style={btnText}>−</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
              <Pressable onPress={() => setQty(item.menu_item_id, item.quantity + 1)} style={btn}>
                <Text style={btnText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      <View style={{ padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#eee' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontWeight: '600' }}>Subtotal</Text>
          <Text style={{ fontWeight: '700' }}>{formatMoney(subtotal(), restaurant_currency)}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/checkout')}
          style={{ backgroundColor: '#f59e0b', padding: 16, borderRadius: 12 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Checkout</Text>
        </Pressable>
        <Pressable onPress={() => { clear(); router.back(); }} style={{ padding: 12 }}>
          <Text style={{ color: '#999', textAlign: 'center' }}>Clear cart</Text>
        </Pressable>
      </View>
    </View>
  );
}

const btn = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#fffbeb',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const btnText = { color: '#f59e0b', fontSize: 18, fontWeight: '700' as const };
