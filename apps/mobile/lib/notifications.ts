import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { getSupabase } from '@/lib/supabase';

// Lazy-load so a missing native module never blocks app startup in Expo Go.
async function getNotifications() {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function registerForPushNotifications(userId?: string) {
  if (!Device.isDevice) return null;

  const Notifications = await getNotifications();
  if (!Notifications) return null;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync(
        projectId && projectId !== 'replace-with-eas-project-id' ? { projectId } : undefined,
      )
    ).data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'RVA Now',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const supabase = getSupabase();
    if (supabase && userId) {
      await supabase.from('push_tokens').upsert(
        { user_id: userId, token, platform: Platform.OS },
        { onConflict: 'token' },
      );
    }

    return token;
  } catch {
    return null;
  }
}
