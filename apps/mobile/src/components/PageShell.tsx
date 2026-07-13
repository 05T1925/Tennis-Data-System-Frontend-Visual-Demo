import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/theme/tokens';

type PageShellProps = PropsWithChildren<{
  title?: string;
  description?: string;
  eyebrow?: string;
  footer?: ReactNode;
  edges?: Edge[];
}>;

const tabPageEdges: Edge[] = ['top', 'left', 'right'];

export function PageShell({
  children,
  title,
  description,
  eyebrow,
  footer,
  edges = tabPageEdges,
}: PageShellProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {(eyebrow || title || description) && (
          <View style={styles.header}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {description ? <Text style={styles.description}>{description}</Text> : null}
          </View>
        )}
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.pagePadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
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
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    gap: theme.spacing.xl,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
});
