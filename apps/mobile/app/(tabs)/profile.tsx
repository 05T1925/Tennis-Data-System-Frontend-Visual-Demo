import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

export default function ProfileScreen() {
  const { activeOperation, authError, signOut, user } = useAuthSession();

  return (
    <PageShell title="我的" description="查看当前演示身份和阶段范围。">
      <AppCard>
        <View style={styles.identityHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.displayName ?? 'Demo 用户'}</Text>
            <Text style={styles.badge}>已恢复的 Mock Session</Text>
            {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="阶段 4 说明" />
        <Text style={styles.description}>
          当前身份来自本地 Mock 登录并持久化演示
          Session，不连接真实账号系统，也不具备正式认证安全性。
        </Text>
      </AppCard>

      {authError && activeOperation !== 'password-login' && activeOperation !== 'demo-login' ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {authError.userMessage}
        </Text>
      ) : null}

      <AppButton
        label="退出 Demo 身份"
        loading={activeOperation === 'logout'}
        onPress={() => void signOut()}
        variant="secondary"
      />
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
  email: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
});
