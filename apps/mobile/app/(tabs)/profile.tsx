import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { mobileApiMode } from '@/config/env';
import { useAuthSession } from '@/features/auth';
import { theme } from '@/theme/tokens';

export default function ProfileScreen() {
  const { activeOperation, authError, signOut, user } = useAuthSession();

  const isMockMode = mobileApiMode.status === 'ready' && mobileApiMode.mode === 'mock';

  return (
    <PageShell title="我的" description="查看当前身份和 API 模式。">
      <AppCard>
        <View style={styles.identityHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>D</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.displayName ?? '用户'}</Text>
            <Text style={styles.badge}>{isMockMode ? '本地 Mock Session' : 'Real API Draft'}</Text>
            {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="身份说明" />
        <Text style={styles.description}>
          {isMockMode
            ? '当前身份来自本地 Mock 登录并持久化演示 Session，不具备正式认证安全性。'
            : '当前身份来自前端 Draft Contract，Token 只保存在运行内存中，不代表正式认证已完成。'}
        </Text>
      </AppCard>

      {authError && activeOperation !== 'password-login' && activeOperation !== 'demo-login' ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {authError.userMessage}
        </Text>
      ) : null}

      <AppButton
        label="退出登录"
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
