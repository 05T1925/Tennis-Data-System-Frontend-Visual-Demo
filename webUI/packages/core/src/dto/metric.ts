import type { DataTier, MetricDimension, MetricPlayerSlot, ScopeType } from '../domain/types';
export interface MetricDto {
  upload_id: string;
  player_slot: MetricPlayerSlot;
  metric_code: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: string;
  sample_size: number;
  scope_type: ScopeType;
  scope_id: string;
  dimension: MetricDimension;
  confidence: number;
  algorithm_version: string;
  created_at: string;
  data_tier: DataTier;
  evidence_ids: string[];
}
