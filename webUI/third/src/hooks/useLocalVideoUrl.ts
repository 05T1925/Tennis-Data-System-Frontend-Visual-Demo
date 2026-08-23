import { useEffect, useRef, useState } from 'react';

export function useLocalVideoUrl() {
  const [url, setUrl] = useState<string | null>(null);
  const current = useRef<string | null>(null);
  const selectFile = (file: File) => {
    if (current.current) URL.revokeObjectURL(current.current);
    const next = URL.createObjectURL(file);
    current.current = next;
    setUrl(next);
  };
  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );
  return { url, selectFile };
}
