import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Foreground notification behaviour. Apps decide whether to show a banner
// when the app is already open — we show it so customers see daily-menu
// alerts even while browsing.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push permission, fetch the Expo push token, and write it to the
 * `push_tokens` table for the signed-in user.
 *
 * Call this once at app launch after the user is authenticated.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push doesn't work in the iOS simulator / Android emulator.
    return null;
  }

  // Android requires a notification channel for the alerts to show.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fbbf24',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenResponse.data;
  if (!token) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return token;

  await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform: Platform.OS,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

  return token;
}

export function addNotificationListeners(handlers: {
  onReceive?: (n: Notifications.Notification) => void;
  onTap?: (response: Notifications.NotificationResponse) => void;
}) {
  const subs: Notifications.Subscription[] = [];
  if (handlers.onReceive) {
    subs.push(Notifications.addNotificationReceivedListener(handlers.onReceive));
  }
  if (handlers.onTap) {
    subs.push(Notifications.addNotificationResponseReceivedListener(handlers.onTap));
  }
  return () => subs.forEach((s) => s.remove());
}
