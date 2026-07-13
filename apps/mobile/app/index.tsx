import { Redirect } from 'expo-router';

import { useAuthSession } from '@/features/auth';

export default function IndexScreen() {
  const { isAuthenticated } = useAuthSession();

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
