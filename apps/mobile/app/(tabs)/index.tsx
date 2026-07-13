import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import { useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

const previewMetrics = ['击球次数', '回合数', '平均球速'];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthSession();

  return (
    <PageShell
      eyebrow="训练概览"
      title={`你好，${user?.displayName ?? 'Demo 用户'}`}
      description="从一段清晰的球场视频开始，后续分析结果会集中展示在这里。"
    >
      <AppCard>
        <Text style={styles.actionTitle}>准备分析一次训练？</Text>
        <Text style={styles.bodyText}>当前阶段先提供完整页面与导航结构，暂不选择或上传视频。</Text>
        <AppButton label="上传网球视频" onPress={() => router.push('/upload')} />
      </AppCard>

      <View style={styles.section}>
        <SectionTitle title="最近分析" description="完成视频分析后，最近任务会显示在这里。" />
        <AppCard>
          <EmptyState title="暂无分析" description="上传和分析能力将在后续阶段接入。" />
        </AppCard>
      </View>

      <View style={styles.section}>
        <SectionTitle title="统计预览" description="只展示指标结构，不提供虚构业务数字。" />
        <View style={styles.metricGrid}>
          {previewMetrics.map((metric) => (
            <AppCard key={metric}>
              <Text style={styles.metricLabel}>{metric}</Text>
              <Text style={styles.metricValue}>—</Text>
              <Text style={styles.metricHint}>完成分析后显示</Text>
            </AppCard>
          ))}
        </View>
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  section: {
    gap: theme.spacing.md,
  },
  metricGrid: {
    gap: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  metricHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
});
