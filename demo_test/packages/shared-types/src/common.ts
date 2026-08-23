/** Stable identifier used by v0.1 domain entities. */
export type EntityId = string;

/**
 * ISO 8601 date-time string, for example 2026-07-13T12:30:00.000Z.
 */
export type IsoDateTimeString = string;

/**
 * Confidence value expected to be between 0 and 1. This type does not perform runtime validation.
 */
export type ConfidenceScore = number;

/** Stage 1 compatibility type used by the existing application shells. */
export type AppSurface = 'mobile' | 'web-dashboard';

/** Project stages represented by the current repository. */
export type ProjectStage = 'stage-0' | 'stage-1' | 'stage-2';
