import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell } from '@/components';
import { useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

export default function LoginScreen() {
  const { signInDemo } = useAuthSession();

  return (
    <PageShell edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>T</Text>
        </View>
        <Text style={styles.eyebrow}>TENNIS VIDEO LAB</Text>
        <Text style={styles.title}>让每一次训练，都有数据可循</Text>
        <Text style={styles.description}>
          上传网球视频，查看分析状态，并获取清楚易懂的训练统计。
        </Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>进入本地产品演示</Text>
        <Text style={styles.cardDescription}>
          本阶段使用固定 Demo 身份，不会连接真实账号系统，也不会提交任何个人信息。
        </Text>
        <AppButton label="使用 Demo 身份进入" onPress={signInDemo} />
      </AppCard>

      <Text style={styles.notice}>登录状态仅保存在内存中，App 刷新或重启后会自动退出。</Text>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  brandMark: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
  },
  brandMarkText: {
    color: theme.colors.onPrimary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.extraBold,
    lineHeight: 46,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 25,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  cardDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 21,
  },
  notice: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
