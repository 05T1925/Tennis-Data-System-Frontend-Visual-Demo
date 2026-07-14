import type { ImagePickerAsset } from 'expo-image-picker';
import { describe, expect, it } from 'vitest';

import { adaptImagePickerAsset, toCreateVideoInput } from '../assetAdapter';
import { MAX_VIDEO_FILE_SIZE_BYTES } from '../constants';

function asset(overrides: Partial<ImagePickerAsset> = {}): ImagePickerAsset {
  return {
    uri: 'file:///training.mp4',
    width: 1920,
    height: 1080,
    type: 'video',
    fileName: 'training.mp4',
    fileSize: 10_000,
    duration: 120_000,
    mimeType: 'video/mp4',
    ...overrides,
  };
}

describe('adaptImagePickerAsset', () => {
  it.each([
    ['MP4', asset(), 'video/mp4'],
    [
      'MOV',
      asset({ fileName: 'match.mov', uri: 'file:///match.mov', mimeType: 'video/quicktime' }),
      'video/quicktime',
    ],
  ] as const)('adapts a normal %s video', async (_label, input, mimeType) => {
    await expect(adaptImagePickerAsset(input)).resolves.toMatchObject({ mimeType });
  });

  it('converts duration milliseconds to seconds', async () => {
    await expect(adaptImagePickerAsset(asset({ duration: 123_500 }))).resolves.toMatchObject({
      durationSeconds: 123.5,
    });
  });

  it('keeps zero duration and allows missing duration', async () => {
    await expect(adaptImagePickerAsset(asset({ duration: 0 }))).resolves.toMatchObject({
      durationSeconds: 0,
    });
    expect(
      (await adaptImagePickerAsset(asset({ duration: null }))).durationSeconds,
    ).toBeUndefined();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid duration %s',
    async (duration) => {
      await expect(adaptImagePickerAsset(asset({ duration }))).rejects.toMatchObject({
        code: 'INVALID_VIDEO_DURATION',
      });
    },
  );

  it('uses the provided filename and safely falls back to the URI', async () => {
    await expect(adaptImagePickerAsset(asset())).resolves.toMatchObject({
      fileName: 'training.mp4',
    });
    await expect(
      adaptImagePickerAsset(
        asset({ fileName: null, uri: 'file:///My%20Training.mp4?token=hidden' }),
      ),
    ).resolves.toMatchObject({ fileName: 'My Training.mp4' });
    await expect(
      adaptImagePickerAsset(asset({ fileName: null, uri: 'file:///%E0%A4%A.mp4' })),
    ).resolves.toMatchObject({ fileName: '%E0%A4%A.mp4' });
  });

  it.each([
    ['clip.mp4', 'video/mp4'],
    ['clip.mov', 'video/quicktime'],
  ] as const)('infers missing MIME for %s', async (fileName, mimeType) => {
    await expect(
      adaptImagePickerAsset(asset({ fileName, uri: `file:///${fileName}`, mimeType: undefined })),
    ).resolves.toMatchObject({ mimeType });
  });

  it.each([
    asset({ mimeType: 'image/jpeg' }),
    asset({ type: 'image' }),
    asset({ type: 'livePhoto' }),
    asset({ type: 'pairedVideo' }),
    asset({ uri: '   ' }),
  ])('rejects non-video or unusable assets', async (input) => {
    await expect(adaptImagePickerAsset(input)).rejects.toBeDefined();
  });

  it('uses ImagePicker, Web File, then FileSystem size metadata', async () => {
    await expect(adaptImagePickerAsset(asset({ fileSize: 42 }))).resolves.toMatchObject({
      fileSizeBytes: 42,
    });
    const webFile = new File([new Uint8Array(64)], 'web.mp4', { type: 'video/mp4' });
    await expect(
      adaptImagePickerAsset(asset({ fileSize: undefined, file: webFile })),
    ).resolves.toMatchObject({
      fileSizeBytes: 64,
    });
    await expect(
      adaptImagePickerAsset(asset({ fileSize: undefined, file: undefined }), () => 128),
    ).resolves.toMatchObject({ fileSizeBytes: 128 });
  });

  it('rejects missing, empty, negative, non-finite and fractional file sizes', async () => {
    await expect(adaptImagePickerAsset(asset({ fileSize: undefined }))).rejects.toMatchObject({
      code: 'MISSING_FILE_SIZE',
    });
    await expect(adaptImagePickerAsset(asset({ fileSize: 0 }))).rejects.toMatchObject({
      code: 'EMPTY_VIDEO_FILE',
    });
    for (const fileSize of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
      await expect(adaptImagePickerAsset(asset({ fileSize }))).rejects.toMatchObject({
        code: 'MISSING_FILE_SIZE',
      });
    }
  });

  it('accepts exactly 500 MiB and rejects larger videos', async () => {
    await expect(
      adaptImagePickerAsset(asset({ fileSize: MAX_VIDEO_FILE_SIZE_BYTES })),
    ).resolves.toMatchObject({ fileSizeBytes: MAX_VIDEO_FILE_SIZE_BYTES });
    await expect(
      adaptImagePickerAsset(asset({ fileSize: MAX_VIDEO_FILE_SIZE_BYTES + 1 })),
    ).rejects.toMatchObject({ code: 'VIDEO_TOO_LARGE' });
  });

  it('does not map the local URI into CreateVideoInput', async () => {
    const selected = await adaptImagePickerAsset(asset());
    const input = toCreateVideoInput(selected, {
      title: '训练',
      matchType: 'training',
      playMode: 'singles',
      courtType: 'hard',
      note: '   ',
    });

    expect('uri' in input).toBe(false);
    expect(input.note).toBeUndefined();
  });
});
