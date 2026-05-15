import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function AccountScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Account</Text>
      <Link href="/sign-in" asChild>
        <Pressable style={{ backgroundColor: '#ea580c', padding: 14, borderRadius: 8, marginTop: 24 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Sign in</Text>
        </Pressable>
      </Link>
    </View>
  );
}
