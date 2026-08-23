import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { WebClock } from '../../demo-data';
import { getLocalDateKey, getMillisecondsUntilNextLocalDay } from '../localDate';
import { getWebOverviewPollingInterval, webStatisticsQueryKeys } from '../queryKeys';
import { webStatisticsClock, webStatisticsService } from '../service';

export function useWebOverviewStatistics(options: {
  actorUserId: string;
  enabled: boolean;
  clock?: WebClock;
}) {
  const clock = options.clock ?? webStatisticsClock;
  const [localDateKey, setLocalDateKey] = useState(() => getLocalDateKey(clock.now()));

  useEffect(() => {
    let timeoutId: number | null = null;
    const scheduleNextDay = () => {
      const now = clock.now();
      timeoutId = window.setTimeout(
        () => {
          setLocalDateKey(getLocalDateKey(clock.now()));
          scheduleNextDay();
        },
        getMillisecondsUntilNextLocalDay(now) + 50,
      );
    };
    scheduleNextDay();
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [clock, options.actorUserId]);

  const query = useQuery({
    queryKey: webStatisticsQueryKeys.overview(options.actorUserId, localDateKey),
    enabled: options.enabled && options.actorUserId.trim().length > 0,
    queryFn: ({ signal }) =>
      webStatisticsService.getOverview({ actorUserId: options.actorUserId, signal }),
    placeholderData: undefined,
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (current) =>
      getWebOverviewPollingInterval(current.state.data, current.state.error !== null),
    refetchIntervalInBackground: false,
  });

  return { ...query, localDateKey };
}
