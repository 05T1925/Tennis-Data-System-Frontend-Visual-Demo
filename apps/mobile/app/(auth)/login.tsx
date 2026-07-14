import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell } from '@/components';
import {
  AgreementCheckbox,
  AuthTextField,
  loginFormSchema,
  type LoginFormInput,
  type LoginFormValues,
  useAuthSession,
} from '@/features/auth';
import { theme } from '@/theme/tokens';

export default function LoginScreen() {
  const { activeOperation, authError, clearAuthError, login, signInDemo } = useAuthSession();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    control,
    getValues,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
      acceptedTerms: false,
    },
  });

  const loginInProgress = activeOperation === 'password-login' || activeOperation === 'demo-login';

  const clearServiceError = () => {
    if (authError) clearAuthError();
  };

  const submitPasswordLogin = handleSubmit(async ({ email, password }) => {
    await login({ email, password });
  });

  const submitDemoLogin = async () => {
    if (!getValues('acceptedTerms')) {
      setError('acceptedTerms', {
        type: 'manual',
        message: '请先同意用户协议和隐私政策。',
      });
      return;
    }

    clearErrors('acceptedTerms');
    await signInDemo();
  };

  return (
    <PageShell edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.hero}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>T</Text>
        </View>
        <Text style={styles.eyebrow}>TENNIS VIDEO LAB</Text>
        <Text style={styles.title}>让每一次训练，都有数据可循</Text>
        <Text style={styles.description}>使用公开 Mock 账号登录，体验网球视频分析产品流程。</Text>
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>登录 Demo</Text>
        <Text style={styles.cardDescription}>
          账号仅用于本地演示，不连接真实认证系统。密码不会保存到设备。
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoComplete="email"
              disabled={loginInProgress}
              error={errors.email?.message}
              keyboardType="email-address"
              label="邮箱"
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                clearServiceError();
                onChange(nextValue);
              }}
              placeholder="demo@tennis.local"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, onChange, value } }) => (
            <AuthTextField
              autoComplete="password"
              disabled={loginInProgress}
              error={errors.password?.message}
              isPassword
              label="密码"
              onBlur={onBlur}
              onChangeText={(nextValue) => {
                clearServiceError();
                onChange(nextValue);
              }}
              onTogglePasswordVisibility={() => setPasswordVisible((visible) => !visible)}
              passwordVisible={passwordVisible}
              placeholder="至少 8 位"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="acceptedTerms"
          render={({ field: { onChange, value } }) => (
            <AgreementCheckbox
              checked={value}
              disabled={loginInProgress}
              error={errors.acceptedTerms?.message}
              onChange={(checked) => {
                clearServiceError();
                onChange(checked);
              }}
            />
          )}
        />

        {authError ? (
          <Text accessibilityRole="alert" style={styles.serviceError}>
            {authError.userMessage}
          </Text>
        ) : null}

        <AppButton
          disabled={loginInProgress}
          label="登录"
          loading={activeOperation === 'password-login'}
          onPress={() => void submitPasswordLogin()}
        />
        <AppButton
          disabled={loginInProgress}
          label="使用 Demo 账号进入"
          loading={activeOperation === 'demo-login'}
          onPress={() => void submitDemoLogin()}
          variant="secondary"
        />
      </AppCard>

      <View style={styles.credentials}>
        <Text style={styles.credentialsTitle}>公开 Demo 凭据</Text>
        <Text style={styles.notice}>demo@tennis.local / TennisDemo123!</Text>
        <Text style={styles.notice}>网络错误场景：network@tennis.local / NetworkDemo123!</Text>
      </View>
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
  serviceError: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  credentials: {
    gap: theme.spacing.xs,
  },
  credentialsTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
  },
  notice: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
