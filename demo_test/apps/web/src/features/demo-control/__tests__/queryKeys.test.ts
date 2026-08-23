import { describe, expect, it } from 'vitest';

import { webDemoControlMutationKeys } from '../queryKeys';

describe('Web Demo control mutation keys', () => {
  it('scopes reset, create and force-complete operations', () => {
    expect(webDemoControlMutationKeys.reset('admin')).toEqual([
      'web-demo-control',
      'reset',
      'admin',
    ]);
    expect(webDemoControlMutationKeys.create('admin', 'failed')).toEqual([
      'web-demo-control',
      'create',
      'admin',
      'failed',
    ]);
    expect(webDemoControlMutationKeys.forceComplete('admin', 'video')).toEqual([
      'web-demo-control',
      'force-complete',
      'admin',
      'video',
    ]);
  });
});
