import { Text, View } from 'react-native';

export default function OrdersScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Your orders</Text>
      <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>
        Sign in to see your past and active orders.
      </Text>
    </View>
  );
}
