import { Redirect } from 'expo-router';

import { useAuthSession } from '@/features/auth';

export default function IndexScreen() {
  const { isAuthenticated, status } = useAuthSession();

  if (status === 'restoring') {
    return null;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
