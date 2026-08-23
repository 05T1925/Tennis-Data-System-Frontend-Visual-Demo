import { describe, expect, it, vi } from 'vitest';

import {
  createSafeDemoJsonFileName,
  downloadDemoJson,
  safeStringifyDemoJson,
  type DemoJsonDownloadDependencies,
} from '../jsonTransfer';

function dependencies(): {
  deps: DemoJsonDownloadDependencies;
  anchor: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  revokeObjectURL: ReturnType<typeof vi.fn>;
} {
  const anchor = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
  const revokeObjectURL = vi.fn();
  return {
    anchor,
    revokeObjectURL,
    deps: {
      createBlob: (parts, options) => new Blob(parts, options),
      createObjectURL: () => 'blob:demo',
      revokeObjectURL,
      createAnchor: () => anchor,
    },
  };
}

describe('Demo JSON transfer', () => {
  it('formats valid JSON and rejects circular values safely', () => {
    expect(safeStringifyDemoJson({ demo: true })).toContain('\n  "demo": true');
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => safeStringifyDemoJson(circular)).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_JSON_INVALID' }),
    );
  });

  it('creates a safe filename containing demo', () => {
    expect(createSafeDemoJsonFileName('../video id/中文')).toBe(
      'tennis-web-cv-demo-..-video-id.json',
    );
  });

  it('clicks, removes and revokes a normal download', () => {
    const { deps, anchor, revokeObjectURL } = dependencies();
    downloadDemoJson('{"demo":true}', 'video-1', deps);
    expect(anchor.download).toBe('tennis-web-cv-demo-video-1.json');
    expect(anchor.href).toBe('blob:demo');
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:demo');
  });

  it('cleans up when click fails', () => {
    const { deps, anchor, revokeObjectURL } = dependencies();
    anchor.click.mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => downloadDemoJson('{}', 'video', deps)).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DOWNLOAD_FAILED' }),
    );
    expect(anchor.remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:demo');
  });

  it('fails safely when Blob or object URL creation fails', () => {
    const first = dependencies();
    first.deps.createBlob = () => {
      throw new Error('Blob unavailable');
    };
    expect(() => downloadDemoJson('{}', 'video', first.deps)).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DOWNLOAD_FAILED' }),
    );
    expect(first.anchor.click).not.toHaveBeenCalled();

    const second = dependencies();
    second.deps.createObjectURL = () => {
      throw new Error('URL unavailable');
    };
    expect(() => downloadDemoJson('{}', 'video', second.deps)).toThrowError(
      expect.objectContaining({ code: 'WEB_DEMO_DOWNLOAD_FAILED' }),
    );
    expect(second.anchor.click).not.toHaveBeenCalled();
  });
});
