import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme/tokens';

type ChoiceOption<T extends string> = { label: string; value: T };

type UploadChoiceFieldProps<T extends string> = {
  label: string;
  value: T;
  options: readonly ChoiceOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
};

export function UploadChoiceField<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
}: UploadChoiceFieldProps<T>) {
  return (
    <View accessibilityRole="radiogroup" style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityLabel={`${label}：${option.label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                pressed && !disabled ? styles.optionPressed : null,
                disabled ? styles.optionDisabled : null,
              ]}
            >
              <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  option: {
    minHeight: theme.layout.controlHeight,
    minWidth: 76,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
  },
  optionSelected: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primary },
  optionPressed: { backgroundColor: theme.colors.surfacePressed },
  optionDisabled: { opacity: 0.6 },
  optionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.medium,
  },
  optionTextSelected: { color: theme.colors.primary, fontWeight: theme.fontWeights.bold },
  error: { color: theme.colors.danger, fontSize: theme.fontSizes.sm },
});
