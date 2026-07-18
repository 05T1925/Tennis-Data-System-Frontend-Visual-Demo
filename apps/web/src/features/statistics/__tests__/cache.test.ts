import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { invalidateWebOverviewStatistics } from '../cache';
import { webStatisticsQueryKeys } from '../queryKeys';

describe('Overview Statistics cache invalidation', () => {
  it('invalidates only active Statistics queries and preserves unrelated cache', async () => {
    const client = new QueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const clearSpy = vi.spyOn(client, 'clear');
    client.setQueryData(['web-auth', 'session'], { actorUserId: 'admin' });

    await invalidateWebOverviewStatistics(client);

    expect(invalidateSpy).toHaveBeenCalledOnce();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: webStatisticsQueryKeys.all,
      refetchType: 'active',
    });
    expect(clearSpy).not.toHaveBeenCalled();
    expect(client.getQueryData(['web-auth', 'session'])).toEqual({ actorUserId: 'admin' });
  });
});
