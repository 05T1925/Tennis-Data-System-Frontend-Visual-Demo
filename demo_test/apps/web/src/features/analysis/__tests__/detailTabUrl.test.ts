import { describe, expect, it } from 'vitest';

import {
  areWebDetailSearchParamsEqual,
  parseWebDetailTab,
  removeWebDetailTab,
  updateWebDetailTab,
} from '../detailTabUrl';

describe('detailTab URL', () => {
  it('omits default and normalizes invalid values', () => {
    expect(parseWebDetailTab(new URLSearchParams()).tab).toBe('basic');
    const invalid = parseWebDetailTab(new URLSearchParams('q=serve&detailTab=bad'));
    expect(invalid.tab).toBe('basic');
    expect(invalid.normalizedSearchParams.toString()).toBe('q=serve');
  });

  it('updates and restores every non-default Tab', () => {
    for (const tab of ['result', 'shots', 'cv', 'logs'] as const) {
      const updated = updateWebDetailTab(new URLSearchParams('q=serve&page=2'), tab);
      expect(parseWebDetailTab(updated).tab).toBe(tab);
      expect(updated.get('q')).toBe('serve');
    }
  });

  it('removes only detailTab for the list return URL', () => {
    const result = removeWebDetailTab(new URLSearchParams('q=x&page=2&detailTab=cv&source=review'));
    expect(result.toString()).toBe('q=x&page=2&source=review');
    expect(areWebDetailSearchParamsEqual(result, new URLSearchParams(result))).toBe(true);
  });
});
