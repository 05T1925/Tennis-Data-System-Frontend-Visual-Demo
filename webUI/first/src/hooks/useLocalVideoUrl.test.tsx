import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocalVideoUrl } from './useLocalVideoUrl';

function Harness() {
  const { videoUrl, fileName, error, selectFile } = useLocalVideoUrl();
  return (
    <>
      <input
        aria-label="video"
        type="file"
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
      />
      <span>{videoUrl ?? 'empty'}</span>
      <span>{fileName ?? 'none'}</span>
      <span>{error ?? 'no-error'}</span>
    </>
  );
}

describe('useLocalVideoUrl', () => {
  const createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
  const revokeObjectURL = vi.fn();
  afterEach(() => {
    vi.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });
  it('creates, replaces, and revokes local object URLs without storage', () => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const view = render(<Harness />);
    const input = screen.getByLabelText('video');
    fireEvent.change(input, {
      target: { files: [new File(['a'], 'one.mp4', { type: 'video/mp4' })] },
    });
    expect(screen.getByText('blob:one.mp4')).toBeInTheDocument();
    fireEvent.change(input, {
      target: { files: [new File(['b'], 'two.webm', { type: 'video/webm' })] },
    });
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:one.mp4');
    view.unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:two.webm');
  });
  it('rejects empty and non-video files safely', () => {
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('video'), {
      target: { files: [new File([], 'note.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByText('请选择可播放的视频文件。')).toBeInTheDocument();
    expect(createObjectURL).not.toHaveBeenCalled();
  });
});
