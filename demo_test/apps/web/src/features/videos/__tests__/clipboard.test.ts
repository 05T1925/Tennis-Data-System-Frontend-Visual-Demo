import { describe, expect, it, vi } from 'vitest';

import { copyTextToClipboard } from '../clipboard';

describe('copyTextToClipboard', () => {
  it('writes through the injected Clipboard API', async () => {
    const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue();
    await copyTextToClipboard('video-1', { writeText });
    expect(writeText).toHaveBeenCalledWith('video-1');
  });

  it('fails safely when Clipboard is unavailable', async () => {
    await expect(copyTextToClipboard('video-1', undefined)).rejects.toMatchObject({
      code: 'WEB_CLIPBOARD_UNAVAILABLE',
    });
  });

  it('fails safely when writeText rejects', async () => {
    const writeText = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValue(new Error('denied'));
    await expect(copyTextToClipboard('video-1', { writeText })).rejects.toMatchObject({
      code: 'WEB_CLIPBOARD_UNAVAILABLE',
    });
  });
});
