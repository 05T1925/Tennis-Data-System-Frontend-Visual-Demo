import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

const videoTips = ['保持球场完整可见', '尽量使用固定机位', '保证环境光线清楚'];

export default function UploadScreen() {
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <PageShell
      eyebrow="新建分析"
      title="上传网球视频"
      description="拍摄或选择一段能清楚看到球场和球员的视频。"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<AppButton label="返回首页" variant="secondary" onPress={goBack} />}
    >
      <AppCard>
        <SectionTitle title="拍摄建议" description="良好的机位有助于后续分析。" />
        <View style={styles.tipList}>
          {videoTips.map((tip, index) => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipIndex}>
                <Text style={styles.tipIndexText}>{index + 1}</Text>
              </View>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle
          title="选择视频"
          description="本阶段不申请相册权限、不读取文件，也不模拟上传进度。"
        />
        <AppButton label="选择视频（后续阶段接入）" disabled />
      </AppCard>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  tipList: {
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
  },
});
