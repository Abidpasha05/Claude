import { Text, View } from 'react-native';

export default function SubscriptionsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Meal plans</Text>
      <Text style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>
        Subscribe to weekly or monthly meal plans from your favourite restaurants.
      </Text>
    </View>
  );
}
