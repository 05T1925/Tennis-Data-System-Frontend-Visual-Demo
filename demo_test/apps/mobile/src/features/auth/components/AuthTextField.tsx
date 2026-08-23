import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/theme/tokens';

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  error?: string;
  placeholder: string;
  disabled?: boolean;
  isPassword?: boolean;
  passwordVisible?: boolean;
  onTogglePasswordVisibility?: () => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  autoComplete?: 'email' | 'password';
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  disabled = false,
  isPassword = false,
  passwordVisible = false,
  onTogglePasswordVisibility,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete,
}: AuthTextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={!disabled}
          keyboardType={keyboardType}
          onBlur={onBlur}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textDisabled}
          secureTextEntry={isPassword && !passwordVisible}
          style={styles.input}
          value={value}
        />
        {isPassword && onTogglePasswordVisibility ? (
          <Pressable
            accessibilityLabel={passwordVisible ? '隐藏密码' : '显示密码'}
            accessibilityRole="button"
            disabled={disabled}
            hitSlop={8}
            onPress={onTogglePasswordVisibility}
            style={styles.visibilityButton}
          >
            <Text style={styles.visibilityText}>{passwordVisible ? '隐藏' : '显示'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  inputRow: {
    minHeight: theme.layout.controlHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  input: {
    minHeight: theme.layout.controlHeight,
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
  },
  visibilityButton: {
    minHeight: theme.layout.controlHeight,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  visibilityText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  error: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 18,
  },
});
