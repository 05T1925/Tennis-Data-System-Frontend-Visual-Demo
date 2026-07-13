import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider, useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

function RootNavigator() {
  const { isAuthenticated } = useAuthSession();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.background },
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="upload/index" />
        <Stack.Screen name="videos/[videoId]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
