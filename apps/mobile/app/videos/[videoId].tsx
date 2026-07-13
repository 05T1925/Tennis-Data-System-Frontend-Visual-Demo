import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

const detailSections = [
  {
    title: '视频信息',
    description: '文件名、时长、拍摄时间等信息将在视频数据接入后显示。',
  },
  {
    title: '分析状态',
    description: '分析任务、当前阶段与失败原因将在后续阶段接入。',
  },
  {
    title: '分析结果',
    description: '击球、回合、得分点和训练结论将在分析完成后显示。',
  },
];

export default function VideoDetailScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId?: string | string[] }>();
  const displayedVideoId = Array.isArray(videoId) ? videoId[0] : (videoId ?? '未提供');

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/videos');
  };

  return (
    <PageShell
      eyebrow="结构预览"
      title="视频详情"
      description="此页面用于验证详情导航与未来信息分区。"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<AppButton label="返回视频页" variant="secondary" onPress={goBack} />}
    >
      <AppCard>
        <Text style={styles.parameterLabel}>路由参数 videoId</Text>
        <Text style={styles.parameterValue}>{displayedVideoId}</Text>
        <Text style={styles.notice}>当前没有与此参数对应的真实视频数据。</Text>
      </AppCard>

      {detailSections.map((section) => (
        <AppCard key={section.title}>
          <SectionTitle title={section.title} />
          <Text style={styles.placeholder}>—</Text>
          <Text style={styles.description}>{section.description}</Text>
        </AppCard>
      ))}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  parameterLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
  parameterValue: {
    color: theme.colors.info,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  notice: {
    color: theme.colors.warning,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  placeholder: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
});
