import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppButton, AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

export default function VideosScreen() {
  const router = useRouter();

  return (
    <PageShell title="视频" description="管理上传视频，并在后续阶段查看上传和分析生命周期。">
      <AppCard>
        <EmptyState
          title="还没有视频"
          description="当前没有真实视频数据。上传功能将在后续阶段接入。"
          actionLabel="上传第一个视频"
          onAction={() => router.push('/upload')}
        />
      </AppCard>

      <AppCard>
        <SectionTitle
          title="详情页结构预览"
          description="使用固定参数 demo-video 验证导航，不代表存在真实视频记录。"
        />
        <Text style={styles.previewText}>路由参数：demo-video</Text>
        <AppButton
          label="预览详情页结构"
          variant="secondary"
          onPress={() => router.push('/videos/demo-video')}
        />
      </AppCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  previewText: {
    color: theme.colors.info,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
});
