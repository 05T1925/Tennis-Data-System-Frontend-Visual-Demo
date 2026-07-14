import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRouter } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, PageShell, SectionTitle } from '@/components';
import { useAuthSession } from '@/features/auth';
import {
  courtTypeOptions,
  getLeaveProtectionKind,
  matchTypeOptions,
  MAX_VIDEO_NOTE_LENGTH,
  MAX_VIDEO_TITLE_LENGTH,
  playModeOptions,
  SelectedVideoSection,
  shouldOpenLeavePrompt,
  shouldNavigateToUploadedVideo,
  toVideoTitle,
  type SelectedVideoAsset,
  UploadChoiceField,
  type UploadFormInput,
  type UploadFormOutput,
  uploadFormSchema,
  UploadStatusSection,
  UploadTextField,
  useVideoPicker,
  useVideoUploadWorkflow,
} from '@/features/upload';
import { theme } from '@/theme/tokens';

export default function UploadScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthSession();
  const [selectedAsset, setSelectedAsset] = useState<SelectedVideoAsset | null>(null);
  const [allowLeaving, setAllowLeaving] = useState(false);
  const [successTarget, setSuccessTarget] = useState<string | null>(null);
  const pendingNavigationActionRef = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const navigationHandledRef = useRef(false);
  const leavePromptOpenRef = useRef(false);
  const workflow = useVideoUploadWorkflow({ userId: user?.id });
  const {
    control,
    handleSubmit,
    setValue,
    formState: { dirtyFields, errors, isDirty, isValid },
  } = useForm<UploadFormInput, unknown, UploadFormOutput>({
    resolver: zodResolver(uploadFormSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      matchType: 'training',
      playMode: 'singles',
      courtType: 'hard',
      note: '',
    },
  });

  const picker = useVideoPicker({
    onSelected: (asset) => {
      setSelectedAsset(asset);
      workflow.markSelected();
      if (!dirtyFields.title) {
        setValue('title', toVideoTitle(asset.fileName), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  const leaveProtection = getLeaveProtectionKind({
    hasSelectedAsset: selectedAsset !== null,
    isFormDirty: isDirty,
    hasVideoId: workflow.videoId !== null,
    phase: workflow.phase,
    bypass: allowLeaving,
  });

  usePreventRemove(leaveProtection !== null, ({ data }) => {
    if (!shouldOpenLeavePrompt(leavePromptOpenRef.current, allowLeaving)) return;

    const uploading = leaveProtection === 'uploading';
    const title = uploading ? '离开上传页面？' : '放弃当前填写内容？';
    const message = uploading
      ? '视频仍会继续模拟上传，你可以稍后在视频记录中查看状态。'
      : '离开后将丢失已选择的视频和填写的信息。';

    const leave = () => {
      leavePromptOpenRef.current = false;
      pendingNavigationActionRef.current = data.action;
      setAllowLeaving(true);
    };

    if (Platform.OS === 'web') {
      leavePromptOpenRef.current = true;
      if (globalThis.confirm?.(`${title}\n${message}`)) {
        leave();
        return;
      }
      leavePromptOpenRef.current = false;
      return;
    }

    leavePromptOpenRef.current = true;
    Alert.alert(
      title,
      message,
      [
        {
          text: uploading ? '继续等待' : '继续填写',
          style: 'cancel',
          onPress: () => {
            leavePromptOpenRef.current = false;
          },
        },
        { text: '离开页面', style: 'destructive', onPress: leave },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          leavePromptOpenRef.current = false;
        },
      },
    );
  });

  useEffect(() => {
    if (!allowLeaving) return;
    const action = pendingNavigationActionRef.current;
    if (!action) return;
    pendingNavigationActionRef.current = null;
    navigation.dispatch(action);
    if (!successTarget) {
      Promise.resolve().then(() => {
        setAllowLeaving(false);
      });
    }
  }, [allowLeaving, navigation, successTarget]);

  useEffect(() => {
    if (
      !workflow.videoId ||
      !shouldNavigateToUploadedVideo(
        workflow.phase === 'upload-succeeded',
        navigationHandledRef.current,
      )
    ) {
      return;
    }
    navigationHandledRef.current = true;
    setAllowLeaving(true);
    setSuccessTarget(workflow.videoId);
  }, [workflow.phase, workflow.videoId]);

  useEffect(() => {
    if (!allowLeaving || !successTarget) return;
    router.replace({ pathname: '/videos/[videoId]', params: { videoId: successTarget } });
  }, [allowLeaving, router, successTarget]);

  const submitting = workflow.phase === 'creating-video' || workflow.phase === 'starting-upload';
  const uploading = workflow.phase === 'uploading';
  const succeeded = workflow.phase === 'upload-succeeded';
  const fieldsDisabled = submitting || uploading || succeeded || workflow.videoId !== null;
  const selectDisabled = picker.isBusy || fieldsDisabled;
  const startDisabled =
    !selectedAsset ||
    !isValid ||
    picker.isBusy ||
    fieldsDisabled ||
    workflow.isBusy ||
    workflow.phase === 'upload-failed';
  const progress = workflow.video?.uploadProgress ?? 0;

  const submitForm = handleSubmit(async (values) => {
    if (!selectedAsset) return;
    await workflow.submit(selectedAsset, values);
  });

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
      description="选择一段能清楚看到球场和球员的视频，填写训练信息后开始上传。"
      edges={['top', 'bottom', 'left', 'right']}
      footer={
        <View style={styles.footer}>
          <AppButton
            disabled={startDisabled}
            label="开始上传"
            loading={submitting}
            onPress={() => void submitForm()}
          />
          <AppButton label="返回" variant="secondary" onPress={goBack} />
        </View>
      }
    >
      <SelectedVideoSection
        asset={selectedAsset}
        canOpenSettings={picker.canOpenSettings}
        disabled={selectDisabled}
        error={picker.error}
        limitedNotice={picker.limitedNotice}
        onOpenSettings={() => void picker.openSettings()}
        onSelect={() => void picker.selectVideo()}
        pickerBusy={picker.isBusy}
      />

      <AppCard>
        <SectionTitle
          title="视频信息"
          description="这些信息将随视频记录保存，可在失败后继续重试。"
        />
        <Controller
          control={control}
          name="title"
          render={({ field: { onBlur, onChange, value } }) => (
            <UploadTextField
              disabled={fieldsDisabled}
              error={errors.title?.message}
              label="视频名称"
              maxLength={MAX_VIDEO_TITLE_LENGTH}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="例如：周末底线训练"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="matchType"
          render={({ field: { onChange, value } }) => (
            <UploadChoiceField
              disabled={fieldsDisabled}
              label="内容类型"
              onChange={onChange}
              options={matchTypeOptions}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="playMode"
          render={({ field: { onChange, value } }) => (
            <UploadChoiceField
              disabled={fieldsDisabled}
              label="比赛形式"
              onChange={onChange}
              options={playModeOptions}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="courtType"
          render={({ field: { onChange, value } }) => (
            <UploadChoiceField
              disabled={fieldsDisabled}
              label="场地类型"
              onChange={onChange}
              options={courtTypeOptions}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="note"
          render={({ field: { onBlur, onChange, value } }) => (
            <UploadTextField
              disabled={fieldsDisabled}
              error={errors.note?.message}
              label="备注（可选）"
              maxLength={MAX_VIDEO_NOTE_LENGTH}
              multiline
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="记录本次训练目标、机位或其他说明"
              value={value}
            />
          )}
        />
      </AppCard>

      <UploadStatusSection
        error={workflow.operationError}
        onRetry={() => void workflow.retry()}
        onRetryProgress={() => void workflow.retryProgress()}
        phase={workflow.phase}
        progress={progress}
        progressError={workflow.progressError}
        retrying={workflow.isBusy}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  footer: { gap: theme.spacing.md },
});
