import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppLoadingGate } from '@/components/AppLoadingGate';
import { AppProvider } from '@/context/AppContext';
import { AuthProvider } from '@/context/AuthContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppLoadingGate>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#07060A' },
              headerStyle: { backgroundColor: '#07060A' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: '700' },
              headerShadowVisible: false,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
            <Stack.Screen
              name="auth"
              options={{
                title: 'Account',
                headerStyle: { backgroundColor: '#07060A' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Your RVA preferences',
                headerStyle: { backgroundColor: '#07060A' },
                headerTintColor: '#fff',
              }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{
                headerShown: false,
                contentStyle: { backgroundColor: '#07060A' },
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen name="ticket/[code]" options={{ title: 'Ticket' }} />
            <Stack.Screen name="ticket-order" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ title: 'Search' }} />
            <Stack.Screen name="profile" options={{ title: 'Profile' }} />
            <Stack.Screen name="submit" options={{ title: 'Submit Event' }} />
          </Stack>
        </AppLoadingGate>
      </AppProvider>
    </AuthProvider>
  );
}
