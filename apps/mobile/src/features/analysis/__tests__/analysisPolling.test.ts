import { describe, expect, it } from 'vitest';

import { getAnalysisPollingInterval, shouldTriggerAnalysisResume } from '../analysisPresentation';

const activeOptions = {
  isScreenFocused: true,
  appState: 'active',
  hasQueryError: false,
};

describe('analysis polling interval', () => {
  it('polls queued tasks every 3 seconds', () => {
    expect(getAnalysisPollingInterval({ ...activeOptions, status: 'queued' })).toBe(3_000);
  });

  it('polls processing tasks every 2 seconds', () => {
    expect(getAnalysisPollingInterval({ ...activeOptions, status: 'processing' })).toBe(2_000);
  });

  it.each(['succeeded', 'failed', 'canceled', null, undefined, 'future-status'] as const)(
    'does not poll status %s',
    (status) => {
      expect(getAnalysisPollingInterval({ ...activeOptions, status })).toBe(false);
    },
  );

  it('stops after a task query error', () => {
    expect(
      getAnalysisPollingInterval({ ...activeOptions, status: 'queued', hasQueryError: true }),
    ).toBe(false);
  });

  it('stops while the screen is unfocused', () => {
    expect(
      getAnalysisPollingInterval({
        ...activeOptions,
        status: 'processing',
        isScreenFocused: false,
      }),
    ).toBe(false);
  });

  it.each(['background', 'inactive', 'unknown', null] as const)(
    'stops while AppState is %s',
    (appState) => {
      expect(getAnalysisPollingInterval({ ...activeOptions, status: 'processing', appState })).toBe(
        false,
      );
    },
  );
});

describe('analysis polling resume edge', () => {
  const current = {
    isInitialObservation: false,
    capturedGeneration: 2,
    currentGeneration: 2,
  };

  it('triggers once for an environment false-to-true edge', () => {
    expect(
      shouldTriggerAnalysisResume({
        ...current,
        previousEnvironmentActive: false,
        currentEnvironmentActive: true,
      }),
    ).toBe(true);
  });

  it.each([
    [true, true],
    [false, false],
  ] as const)(
    'does not trigger for %s-to-%s',
    (previousEnvironmentActive, currentEnvironmentActive) => {
      expect(
        shouldTriggerAnalysisResume({
          ...current,
          previousEnvironmentActive,
          currentEnvironmentActive,
        }),
      ).toBe(false);
    },
  );

  it('collapses focus and AppState recovery into one combined edge', () => {
    const transitions = [
      [false, false],
      [false, true],
      [true, true],
    ] as const;
    expect(
      transitions.filter(([previousEnvironmentActive, currentEnvironmentActive]) =>
        shouldTriggerAnalysisResume({
          ...current,
          previousEnvironmentActive,
          currentEnvironmentActive,
        }),
      ),
    ).toHaveLength(1);
  });

  it('rejects an edge captured by an old identity generation', () => {
    expect(
      shouldTriggerAnalysisResume({
        ...current,
        previousEnvironmentActive: false,
        currentEnvironmentActive: true,
        currentGeneration: 3,
      }),
    ).toBe(false);
  });

  it('does not treat the initially active environment as a resume', () => {
    expect(
      shouldTriggerAnalysisResume({
        ...current,
        previousEnvironmentActive: false,
        currentEnvironmentActive: true,
        isInitialObservation: true,
      }),
    ).toBe(false);
  });
});
