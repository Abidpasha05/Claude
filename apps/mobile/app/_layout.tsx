import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { registerPushToken, addNotificationListeners } from '@/lib/push';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Register push token whenever the user is authenticated.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) registerPushToken();
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) registerPushToken();
    });

    // Tap on a notification → deep-link to the matching screen.
    const unsubscribe = addNotificationListeners({
      onTap: (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.order_id) router.push(`/order/${data.order_id}`);
        else if (data?.restaurant_id && data?.restaurant_slug) router.push(`/restaurant/${data.restaurant_slug}`);
      },
    });

    return () => {
      authSub.subscription.unsubscribe();
      unsubscribe();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#f97316' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/[slug]" options={{ title: 'Restaurant' }} />
        <Stack.Screen name="cart" options={{ title: 'Your cart', presentation: 'modal' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
        <Stack.Screen name="driver" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      </Stack>
    </>
  );
}
