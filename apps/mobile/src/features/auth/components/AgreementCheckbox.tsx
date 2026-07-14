import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

type AgreementCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
};

export function AgreementCheckbox({
  checked,
  onChange,
  error,
  disabled = false,
}: AgreementCheckboxProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="同意用户协议和隐私政策"
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
          {checked ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.text}>我已阅读并同意《用户协议》和《隐私政策》</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.onPrimary,
    fontWeight: theme.fontWeights.bold,
  },
  text: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 22,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 18,
  },
});
