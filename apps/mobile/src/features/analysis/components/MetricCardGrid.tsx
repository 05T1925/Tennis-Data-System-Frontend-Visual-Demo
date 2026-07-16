import { StyleSheet, Text, View } from 'react-native';

import { AppCard, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { AnalysisMetricGroup } from '../analysisResultPresentation';

export function MetricCardGrid({ groups }: { groups: AnalysisMetricGroup[] }) {
  return (
    <View style={styles.groups}>
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <SectionTitle title={group.title} />
          <View style={styles.grid}>
            {group.items.map((item) => (
              <View key={item.key} style={styles.cell}>
                <AppCard>
                  <View
                    accessible
                    accessibilityLabel={item.accessibilityLabel}
                    style={styles.metric}
                  >
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.value}>{item.value}</Text>
                    <Text style={styles.unit}>单位：{item.unit}</Text>
                    <Text style={styles.explanation}>{item.explanation}</Text>
                  </View>
                </AppCard>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: { gap: theme.spacing.xl },
  group: { gap: theme.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
  cell: { flexBasis: 220, flexGrow: 1, flexShrink: 1 },
  metric: { gap: theme.spacing.sm, minWidth: 0 },
  label: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
  value: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  unit: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  explanation: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
