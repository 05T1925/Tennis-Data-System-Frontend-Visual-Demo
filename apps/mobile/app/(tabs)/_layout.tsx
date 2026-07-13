import { Tabs } from 'expo-router';

import { theme } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: theme.fontSizes.sm,
          fontWeight: theme.fontWeights.bold,
        },
        tabBarStyle: {
          minHeight: 64,
          paddingTop: theme.spacing.sm,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '首页' }} />
      <Tabs.Screen name="videos" options={{ title: '视频' }} />
      <Tabs.Screen name="statistics" options={{ title: '统计' }} />
      <Tabs.Screen name="profile" options={{ title: '我的' }} />
    </Tabs>
  );
}
