import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { SelectedVideoAsset } from '../types';

type SelectedVideoSectionProps = {
  asset: SelectedVideoAsset | null;
  disabled: boolean;
  pickerBusy: boolean;
  error: string | null;
  limitedNotice: string | null;
  canOpenSettings: boolean;
  onSelect: () => void;
  onOpenSettings: () => void;
};

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(seconds?: number) {
  if (seconds === undefined) return '时长未提供';
  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function SelectedVideoSection({
  asset,
  disabled,
  pickerBusy,
  error,
  limitedNotice,
  canOpenSettings,
  onSelect,
  onOpenSettings,
}: SelectedVideoSectionProps) {
  return (
    <AppCard>
      <SectionTitle
        title="选择视频"
        description="支持 MP4、MOV，最大 500 MB；不会读取或保存完整视频内容。"
      />
      {asset ? (
        <View style={styles.metadata}>
          <View style={styles.row}>
            <Text style={styles.key}>文件名</Text>
            <Text selectable style={styles.value}>
              {asset.fileName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>大小</Text>
            <Text style={styles.value}>{formatFileSize(asset.fileSizeBytes)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>时长</Text>
            <Text style={styles.value}>{formatDuration(asset.durationSeconds)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.key}>格式</Text>
            <Text style={styles.valid}>
              已验证 · {asset.mimeType === 'video/mp4' ? 'MP4' : 'MOV'}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.placeholder}>从系统相册选择一段清晰、稳定的网球视频。</Text>
      )}
      {limitedNotice ? <Text style={styles.notice}>{limitedNotice}</Text> : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      <AppButton
        disabled={disabled}
        label={asset ? '更换视频' : '从相册选择视频'}
        loading={pickerBusy}
        onPress={onSelect}
        variant={asset ? 'secondary' : 'primary'}
      />
      {canOpenSettings ? (
        <AppButton label="打开系统设置" onPress={onOpenSettings} variant="secondary" />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  metadata: { gap: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
  key: { width: 52, color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm },
  value: { flex: 1, color: theme.colors.text, fontSize: theme.fontSizes.md },
  valid: {
    flex: 1,
    color: theme.colors.success,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  placeholder: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.md, lineHeight: 24 },
  notice: { color: theme.colors.warning, fontSize: theme.fontSizes.sm, lineHeight: 20 },
  error: { color: theme.colors.danger, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
