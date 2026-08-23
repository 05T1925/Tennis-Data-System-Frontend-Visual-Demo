import type { MetricDto } from '../dto/metric';
import type {
  DataTier,
  MetricDimension,
  MetricPlayerSlot,
  MetricRecord,
  ScopeType,
} from '../domain/types';

const slots: readonly MetricPlayerSlot[] = ['A', 'B', 'ALL'];
const scopes: readonly ScopeType[] = ['upload', 'set', 'game', 'point', 'history'];
const dimensions: readonly MetricDimension[] = [
  'overview',
  'scoring',
  'serve',
  'return',
  'rally',
  'movement',
];
const tiers: readonly DataTier[] = ['P0', 'P1', 'P2'];
const isOneOf = <T>(value: unknown, values: readonly T[]): value is T =>
  values.includes(value as T);
const fail = (message: string): never => {
  throw new Error(`Invalid MetricDto: ${message}`);
};
const finite = (value: unknown, name: string): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fail(`${name} must be finite`);

export function adaptMetricDto(dto: MetricDto): MetricRecord {
  if (!dto || typeof dto !== 'object') fail('value must be an object');
  if (!isOneOf(dto.player_slot, slots)) fail('player_slot');
  if (!isOneOf(dto.scope_type, scopes)) fail('scope_type');
  if (!isOneOf(dto.dimension, dimensions)) fail('dimension');
  if (!isOneOf(dto.data_tier, tiers)) fail('data_tier');
  if (
    !dto.upload_id.trim() ||
    !dto.metric_code.trim() ||
    !dto.metric_name.trim() ||
    !dto.metric_unit.trim() ||
    !dto.scope_id.trim() ||
    !dto.algorithm_version.trim()
  )
    fail('required string');
  if (Number.isNaN(Date.parse(dto.created_at))) fail('created_at must be ISO 8601');
  if (!Number.isInteger(dto.sample_size) || dto.sample_size < 0) fail('sample_size');
  if (finite(dto.confidence, 'confidence') < 0 || dto.confidence > 1)
    fail('confidence must be between 0 and 1');
  if (dto.metric_value !== null && !Number.isFinite(dto.metric_value)) fail('metric_value');
  if (
    dto.metric_code.endsWith('_rate') &&
    dto.metric_value !== null &&
    (dto.metric_value < 0 || dto.metric_value > 1)
  )
    fail('rate metric must be between 0 and 1');
  if (!Array.isArray(dto.evidence_ids) || dto.evidence_ids.some((id) => !id.trim()))
    fail('evidence_ids');
  return {
    uploadId: dto.upload_id,
    playerSlot: dto.player_slot,
    metricCode: dto.metric_code,
    metricName: dto.metric_name,
    metricValue: dto.metric_value,
    metricUnit: dto.metric_unit,
    sampleSize: dto.sample_size,
    scopeType: dto.scope_type,
    scopeId: dto.scope_id,
    dimension: dto.dimension,
    confidence: dto.confidence,
    algorithmVersion: dto.algorithm_version,
    createdAt: dto.created_at,
    dataTier: dto.data_tier,
    evidenceIds: [...dto.evidence_ids],
  };
}
export const adaptMetricDtos = (dtos: readonly MetricDto[]): MetricRecord[] =>
  dtos.map(adaptMetricDto);
