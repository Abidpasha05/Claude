import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#f97316' }, headerTintColor: '#fff' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/[slug]" options={{ title: 'Restaurant' }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      </Stack>
    </>
  );
}
