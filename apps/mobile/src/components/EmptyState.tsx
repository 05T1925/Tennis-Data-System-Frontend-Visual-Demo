import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { theme } from '@/theme/tokens';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <AppButton label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  indicator: {
    width: theme.spacing.xl,
    height: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.pill,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  action: {
    alignSelf: 'stretch',
    marginTop: theme.spacing.md,
  },
});
