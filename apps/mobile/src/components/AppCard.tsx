import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme/tokens';

export function AppCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
  },
});
