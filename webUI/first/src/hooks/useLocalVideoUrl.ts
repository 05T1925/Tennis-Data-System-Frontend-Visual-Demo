import { useCallback, useEffect, useRef, useState } from 'react';
import { safeFileName } from '../features/video/presentation';

export function useLocalVideoUrl() {
  const currentUrl = useRef<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const revokeCurrentUrl = useCallback(() => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
  }, []);

  const selectFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      if (!file.type.startsWith('video/') || file.size <= 0) {
        setError('请选择可播放的视频文件。');
        return;
      }
      revokeCurrentUrl();
      const nextUrl = URL.createObjectURL(file);
      currentUrl.current = nextUrl;
      setVideoUrl(nextUrl);
      setFileName(safeFileName(file.name));
      setError(null);
    },
    [revokeCurrentUrl],
  );

  useEffect(() => revokeCurrentUrl, [revokeCurrentUrl]);
  return { videoUrl, fileName, error, selectFile, clearError: () => setError(null) };
}
