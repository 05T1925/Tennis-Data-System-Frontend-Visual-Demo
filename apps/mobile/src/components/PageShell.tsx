import type { Href } from 'expo-router';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppSurface } from '@tennis/shared-types';

import { theme } from '@/theme/tokens';

type PageLink = {
  href: Href;
  label: string;
};

type PageShellProps = {
  title: string;
  description: string;
  links?: PageLink[];
};

const surface: AppSurface = 'mobile';

export function PageShell({ title, description, links = [] }: PageShellProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{surface} / stage 1</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {links.map((link) => (
          <Link key={link.label} href={link.href} asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xxl,
    fontWeight: '800',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  link: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.surface,
    fontSize: theme.fontSizes.md,
    fontWeight: '700',
  },
});
