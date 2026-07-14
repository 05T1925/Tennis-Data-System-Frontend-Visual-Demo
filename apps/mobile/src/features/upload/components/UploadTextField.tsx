import { StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/theme/tokens';

type UploadTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

export function UploadTextField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  disabled = false,
  multiline = false,
  maxLength,
}: UploadTextFieldProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {maxLength ? (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        editable={!disabled}
        maxLength={maxLength ? maxLength + 1 : undefined}
        multiline={multiline}
        onBlur={onBlur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textDisabled}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          error ? styles.inputError : null,
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: theme.spacing.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md },
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  counter: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
  input: {
    minHeight: theme.layout.controlHeight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    fontSize: theme.fontSizes.md,
  },
  multiline: { minHeight: 112 },
  inputError: { borderColor: theme.colors.danger },
  error: { color: theme.colors.danger, fontSize: theme.fontSizes.sm, lineHeight: 18 },
});
