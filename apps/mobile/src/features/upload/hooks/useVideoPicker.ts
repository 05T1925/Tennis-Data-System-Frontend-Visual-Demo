import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { adaptImagePickerAsset } from '../assetAdapter';
import { getSafeErrorMessage } from '../errors';
import type { SelectedVideoAsset } from '../types';
import { shouldApplyLatestPickerResult } from '../workflow';

type PickerStatus = 'idle' | 'requesting-permission' | 'picking';

type UseVideoPickerOptions = {
  onSelected: (asset: SelectedVideoAsset) => void;
};

function isPickerError(
  result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult,
): result is ImagePicker.ImagePickerErrorResult {
  return 'code' in result;
}

function readNativeFileSize(uri: string) {
  const size = new File(uri).size;
  return size > 0 ? size : undefined;
}

export function useVideoPicker({ onSelected }: UseVideoPickerOptions) {
  const [status, setStatus] = useState<PickerStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [limitedNotice, setLimitedNotice] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);
  const onSelectedRef = useRef(onSelected);
  const pickerRequestIdRef = useRef(0);

  useEffect(() => {
    onSelectedRef.current = onSelected;
  }, [onSelected]);

  const processAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset, requestId: number) => {
      try {
        const selected = await adaptImagePickerAsset(
          asset,
          Platform.OS === 'web' ? undefined : readNativeFileSize,
        );
        if (
          !mountedRef.current ||
          !shouldApplyLatestPickerResult(requestId, pickerRequestIdRef.current)
        ) {
          return;
        }
        setError(null);
        onSelectedRef.current(selected);
      } catch (assetError) {
        if (
          !mountedRef.current ||
          !shouldApplyLatestPickerResult(requestId, pickerRequestIdRef.current)
        ) {
          return;
        }
        setError(getSafeErrorMessage(assetError, '无法读取所选视频，请尝试重新选择。'));
      }
    },
    [],
  );

  const registerPickerRequest = useCallback(() => {
    pickerRequestIdRef.current += 1;
    return pickerRequestIdRef.current;
  }, []);

  const processResult = useCallback(
    async (
      result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null,
      requestId: number,
    ) => {
      if (!result) return;
      if (isPickerError(result)) {
        if (
          mountedRef.current &&
          shouldApplyLatestPickerResult(requestId, pickerRequestIdRef.current)
        ) {
          setError('无法读取系统返回的视频，请重新选择。');
        }
        return;
      }
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset) await processAsset(asset, requestId);
    },
    [processAsset],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (Platform.OS === 'android') {
      const requestId = registerPickerRequest();
      void ImagePicker.getPendingResultAsync()
        .then((result) => processResult(result, requestId))
        .catch(() => {
          if (
            mountedRef.current &&
            shouldApplyLatestPickerResult(requestId, pickerRequestIdRef.current)
          ) {
            setError('无法恢复上次选择的视频，请重新选择。');
          }
        });
    }
    return () => {
      mountedRef.current = false;
    };
  }, [processResult, registerPickerRequest]);

  const launchPicker = useCallback(async () => {
    if (!mountedRef.current) return;
    const requestId = registerPickerRequest();
    setStatus('picking');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        base64: false,
      });
      await processResult(result, requestId);
    } catch {
      if (mountedRef.current) setError('无法打开视频选择器，请稍后重试。');
    } finally {
      if (mountedRef.current) setStatus('idle');
    }
  }, [processResult, registerPickerRequest]);

  const selectVideo = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setError(null);
    setLimitedNotice(null);
    setCanOpenSettings(false);

    try {
      if (Platform.OS === 'web') {
        await launchPicker();
        return;
      }

      setStatus('requesting-permission');
      let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted' && permission.canAskAgain) {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permission.status !== 'granted') {
        if (mountedRef.current) {
          setCanOpenSettings(!permission.canAskAgain);
          setError(
            permission.canAskAgain
              ? '请允许访问相册，以选择网球训练或比赛视频。'
              : '相册权限已关闭，请前往系统设置允许访问后再试。',
          );
        }
        return;
      }

      if (mountedRef.current) {
        setLimitedNotice(
          permission.accessPrivileges === 'limited' ? '当前只能查看你允许访问的部分视频。' : null,
        );
      }
      await launchPicker();
    } catch {
      if (mountedRef.current) setError('无法访问相册，请稍后重试。');
    } finally {
      busyRef.current = false;
      if (mountedRef.current) setStatus('idle');
    }
  }, [launchPicker]);

  const openSettings = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Linking.openSettings();
    } catch {
      if (mountedRef.current) setError('无法打开系统设置，请手动前往设置允许相册访问。');
    }
  }, []);

  return {
    status,
    error,
    limitedNotice,
    canOpenSettings,
    selectVideo,
    openSettings,
    isBusy: status !== 'idle',
  };
}
