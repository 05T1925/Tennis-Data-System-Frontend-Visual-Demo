import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

export default function ProfileScreen() {
  const { user, signOut } = useAuthSession();

  return (
    <PageShell title="我的" description="查看当前演示身份和阶段范围。">
      <AppCard>
        <View style={styles.identityHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.displayName ?? 'Demo 用户'}</Text>
            <Text style={styles.badge}>本地 Demo 身份</Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="阶段 3 说明" />
        <Text style={styles.description}>
          当前身份只用于验证产品导航，不连接账号系统，不保存 Token，也不会持久化到设备。
        </Text>
      </AppCard>

      <AppButton label="退出 Demo 身份" variant="secondary" onPress={signOut} />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.pill,
  },
  avatarText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.extraBold,
  },
  identityText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  badge: {
    color: theme.colors.success,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
});
