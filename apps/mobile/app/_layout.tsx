import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider, useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

function RootNavigator() {
  const { isAuthenticated, status } = useAuthSession();

  // Protected routes must not decide between auth and app screens until restore completes.
  if (status === 'restoring') {
    return (
      <View accessibilityLabel="正在恢复登录状态" style={styles.restoring}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  restoring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
});

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
