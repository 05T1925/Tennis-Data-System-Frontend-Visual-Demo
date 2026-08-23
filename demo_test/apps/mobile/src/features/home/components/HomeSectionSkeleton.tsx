import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components';
import { theme } from '@/theme/tokens';

type HomeSectionSkeletonProps = {
  cards?: number;
};

export function HomeSectionSkeleton({ cards = 1 }: HomeSectionSkeletonProps) {
  return (
    <View accessibilityLabel="正在加载首页数据" style={styles.container}>
      {Array.from({ length: cards }, (_, index) => (
        <AppCard key={index}>
          <View style={[styles.bar, styles.shortBar]} />
          <View style={[styles.bar, styles.valueBar]} />
          <View style={styles.bar} />
        </AppCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  bar: {
    width: '100%',
    height: theme.spacing.md,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.sm,
    opacity: 0.65,
  },
  shortBar: {
    width: '42%',
  },
  valueBar: {
    width: '66%',
    height: theme.spacing.lg,
  },
});
