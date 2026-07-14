import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import { useAuthSession } from '@/features/auth';
import {
  filmingTips,
  getGreeting,
  HomeOverviewSection,
  RecentVideosSection,
  useHomeQueries,
} from '@/features/home';
import { theme } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const home = useHomeQueries(user?.id);

  const openUpload = () => router.navigate('/upload');
  const openVideo = (videoId: string) => {
    if (!videoId.trim()) return;
    router.navigate({ pathname: '/videos/[videoId]', params: { videoId } });
  };

  return (
    <PageShell
      eyebrow="训练概览"
      title={getGreeting(user)}
      description="从一段清晰的球场视频开始，持续积累属于你的训练记录。"
    >
      <AppCard>
        <Text style={styles.actionTitle}>准备开始今天的训练？</Text>
        <Text style={styles.bodyText}>上传一段网球视频，后续分析会集中展示在首页。</Text>
        <AppButton label="上传网球视频" onPress={openUpload} />
      </AppCard>

      <View style={styles.section}>
        <SectionTitle title="拍摄建议" description="清晰稳定的画面有助于后续分析。" />
        <AppCard>
          {filmingTips.map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipIndex}>
                <Text style={styles.tipIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </AppCard>
      </View>

      {home.isEmpty ? (
        <AppCard>
          <EmptyState
            title="从第一次上传开始"
            description="目前还没有训练数据。上传一段视频后，这里会逐步形成你的训练概览。"
            actionLabel="上传第一个视频"
            onAction={openUpload}
          />
        </AppCard>
      ) : null}

      <HomeOverviewSection
        error={home.overviewError}
        fetching={home.overviewFetching}
        onRetry={() => void home.retryOverview()}
        overview={home.overview}
        pending={home.overviewPending}
      />

      <RecentVideosSection
        error={home.videosError}
        fetching={home.videosFetching}
        onRetry={() => void home.retryVideos()}
        onSelectVideo={openVideo}
        pending={home.videosPending}
        videos={home.videos}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actionTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  section: {
    gap: theme.spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  tipIndex: {
    width: theme.spacing.xl,
    height: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.pill,
  },
  tipIndexText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  tipText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    lineHeight: 22,
  },
});
