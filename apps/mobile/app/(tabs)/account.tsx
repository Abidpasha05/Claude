import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      if (user) {
        const { data: m } = await supabase
          .from('restaurant_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'driver')
          .eq('is_active', true)
          .limit(1);
        setIsDriver(!!m?.length);
      }
    })();
  }, []);

  if (!email) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Not signed in</Text>
        <Link href="/sign-in" asChild>
          <Pressable style={{ backgroundColor: '#f59e0b', padding: 14, borderRadius: 8, marginTop: 16 }}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 12, color: '#666' }}>Signed in as</Text>
      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 24 }}>{email}</Text>

      {isDriver && (
        <Link href="/driver" asChild>
          <Pressable style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 12, marginBottom: 12 }}>
            <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>Open driver dashboard</Text>
          </Pressable>
        </Link>
      )}

      <Pressable
        onPress={async () => { await supabase.auth.signOut(); router.replace('/'); }}
        style={{ padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' }}
      >
        <Text style={{ color: '#666', textAlign: 'center' }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
