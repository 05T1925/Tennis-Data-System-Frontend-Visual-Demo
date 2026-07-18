import type { AppError } from '@tennis/shared-types';

import { createWebDemoError } from '../demo-data';

export function safeStringifyDemoJson(value: unknown): string {
  try {
    const serialized = JSON.stringify(value, null, 2);
    if (serialized === undefined) throw new Error('Value is not JSON serializable.');
    return serialized;
  } catch {
    throw createWebDemoError('WEB_DEMO_JSON_INVALID', { retryable: false });
  }
}

export function createSafeDemoJsonFileName(videoId: string): string {
  const safeVideoId =
    videoId
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'video';
  return `tennis-web-cv-demo-${safeVideoId}.json`;
}

type DownloadAnchor = {
  href: string;
  download: string;
  click(): void;
  remove(): void;
};

export type DemoJsonDownloadDependencies = {
  createBlob(parts: BlobPart[], options: BlobPropertyBag): Blob;
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  createAnchor(): DownloadAnchor;
};

const browserDependencies: DemoJsonDownloadDependencies = {
  createBlob: (parts, options) => new Blob(parts, options),
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  createAnchor: () => document.createElement('a'),
};

export function downloadDemoJson(
  serialized: string,
  videoId: string,
  dependencies: DemoJsonDownloadDependencies = browserDependencies,
): void {
  let objectUrl: string | null = null;
  let anchor: DownloadAnchor | null = null;
  try {
    const blob = dependencies.createBlob([serialized], { type: 'application/json;charset=utf-8' });
    objectUrl = dependencies.createObjectURL(blob);
    anchor = dependencies.createAnchor();
    anchor.href = objectUrl;
    anchor.download = createSafeDemoJsonFileName(videoId);
    anchor.click();
  } catch {
    const error: AppError = createWebDemoError('WEB_DEMO_DOWNLOAD_FAILED');
    throw error;
  } finally {
    anchor?.remove();
    if (objectUrl !== null) dependencies.revokeObjectURL(objectUrl);
  }
}
