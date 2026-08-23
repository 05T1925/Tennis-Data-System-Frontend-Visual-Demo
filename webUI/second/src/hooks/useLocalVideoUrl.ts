import { useEffect, useRef, useState } from 'react';

export function useLocalVideoUrl() {
  const [url, setUrl] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const selectFile = (file: File) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    const nextUrl = URL.createObjectURL(file);
    currentUrl.current = nextUrl;
    setUrl(nextUrl);
  };

  useEffect(
    () => () => {
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    },
    [],
  );

  return { url, selectFile };
}
