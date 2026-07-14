import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { UploadPhase } from '../types';
import { clampProgress } from '../workflow';

type UploadStatusSectionProps = {
  phase: UploadPhase;
  progress: number;
  error: string | null;
  progressError: string | null;
  retrying: boolean;
  onRetry: () => void;
  onRetryProgress: () => void;
};

const statusLabels: Record<UploadPhase, string> = {
  idle: '等待选择视频',
  selected: '视频信息已准备好',
  'creating-video': '正在创建上传记录',
  'starting-upload': '正在启动上传',
  uploading: '正在模拟上传',
  'upload-failed': '上传未完成',
  'upload-succeeded': '上传完成',
};

export function UploadStatusSection({
  phase,
  progress,
  error,
  progressError,
  retrying,
  onRetry,
  onRetryProgress,
}: UploadStatusSectionProps) {
  const normalizedProgress = clampProgress(progress);
  const active = ['uploading', 'upload-failed', 'upload-succeeded'].includes(phase);

  return (
    <AppCard>
      <SectionTitle title="上传状态" description={statusLabels[phase]} />
      {active ? (
        <>
          <View
            accessibilityLabel={`上传进度 ${Math.round(normalizedProgress)}%`}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: normalizedProgress }}
            style={styles.track}
          >
            <View
              style={[
                styles.fill,
                phase === 'upload-failed' ? styles.failed : null,
                phase === 'upload-succeeded' ? styles.succeeded : null,
                { width: `${normalizedProgress}%` },
              ]}
            />
          </View>
          <Text style={styles.percentage}>{Math.round(normalizedProgress)}%</Text>
        </>
      ) : (
        <Text style={styles.hint}>选择视频并填写信息后即可开始。</Text>
      )}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {progressError ? (
        <>
          <Text accessibilityRole="alert" style={styles.error}>
            {progressError}
          </Text>
          <AppButton label="重新获取进度" onPress={onRetryProgress} variant="secondary" />
        </>
      ) : null}
      {phase === 'upload-failed' ? (
        <AppButton label="重试上传" loading={retrying} onPress={onRetry} />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  track: {
    height: theme.spacing.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.pill,
  },
  fill: { height: '100%', backgroundColor: theme.colors.primary },
  failed: { backgroundColor: theme.colors.danger },
  succeeded: { backgroundColor: theme.colors.success },
  percentage: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'right',
  },
  hint: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
  error: { color: theme.colors.danger, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
