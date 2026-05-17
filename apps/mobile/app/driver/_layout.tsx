import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Guards the driver route group: must be signed in AND have at least one
// active membership with role='driver'.
export default function DriverLayout() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/sign-in');
        return;
      }
      const { data: memberships } = await supabase
        .from('restaurant_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'driver')
        .eq('is_active', true)
        .limit(1);
      if (!memberships?.length) {
        router.replace('/');
      }
    })();
  }, [router]);

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0f172a' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="index" options={{ title: 'Driver — Available' }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Delivery' }} />
    </Stack>
  );
}
