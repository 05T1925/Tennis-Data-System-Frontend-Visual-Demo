import type { DataTier, MetricDimension } from './types';

export type MetricPlayerScope = 'ALL' | 'PLAYER';
export type MetricValueKind =
  'count' | 'rate' | 'duration_ms' | 'speed_mps' | 'distance_m' | 'number';

export interface MetricDefinition {
  code: string;
  name: string;
  unit: string;
  dimension: MetricDimension;
  dataTier: DataTier;
  playerScope: MetricPlayerScope;
  valueKind: MetricValueKind;
}

type DefinitionRow = readonly [
  code: string,
  name: string,
  unit: string,
  dimension: MetricDimension,
  dataTier: DataTier,
  playerScope: MetricPlayerScope,
  valueKind: MetricValueKind,
];

const rows: readonly DefinitionRow[] = [
  ['video_duration_ms', '视频总时长', 'ms', 'overview', 'P0', 'ALL', 'duration_ms'],
  ['active_duration_ms', '有效运动时长', 'ms', 'overview', 'P0', 'ALL', 'duration_ms'],
  ['point_count', '总分数', 'count', 'overview', 'P0', 'ALL', 'count'],
  ['shot_count', '总击球数', 'count', 'overview', 'P0', 'ALL', 'count'],
  ['avg_rally_shot_count', '平均每分拍数', 'count', 'rally', 'P0', 'ALL', 'number'],
  ['max_rally_shot_count', '最长回合拍数', 'count', 'rally', 'P0', 'ALL', 'count'],
  ['avg_point_duration_ms', '平均每分时长', 'ms', 'overview', 'P0', 'ALL', 'duration_ms'],
  ['point_won_count', '获胜分数', 'count', 'scoring', 'P0', 'PLAYER', 'count'],
  ['point_lost_count', '失分数', 'count', 'scoring', 'P0', 'PLAYER', 'count'],
  ['point_win_rate', '总得分率', 'rate', 'scoring', 'P0', 'PLAYER', 'rate'],
  ['winner_count', '制胜分数', 'count', 'scoring', 'P0', 'PLAYER', 'count'],
  ['forced_error_count', '受迫失误数', 'count', 'scoring', 'P1', 'PLAYER', 'count'],
  ['unforced_error_count', '非受迫失误数', 'count', 'scoring', 'P1', 'PLAYER', 'count'],
  ['max_serve_speed_mps', '最快发球速度', 'm/s', 'serve', 'P0', 'PLAYER', 'speed_mps'],
  ['max_shot_speed_mps', '最快击球速度', 'm/s', 'overview', 'P0', 'PLAYER', 'speed_mps'],
  ['total_move_distance_m', '总移动距离', 'm', 'movement', 'P0', 'PLAYER', 'distance_m'],
  ['avg_move_speed_mps', '平均移动速度', 'm/s', 'movement', 'P0', 'PLAYER', 'speed_mps'],
  ['max_move_speed_mps', '最大移动速度', 'm/s', 'movement', 'P0', 'PLAYER', 'speed_mps'],
  ['shot_in_rate', '总界内率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['forehand_shot_count', '正手击球数', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['forehand_shot_rate', '正手使用率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['forehand_in_rate', '正手界内率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['backhand_shot_count', '反手击球数', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['backhand_shot_rate', '反手使用率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['backhand_in_rate', '反手界内率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['unforced_error_rate', '非受迫失误率', 'rate', 'rally', 'P1', 'PLAYER', 'rate'],
  ['forehand_unforced_error_rate', '正手非受迫失误率', 'rate', 'rally', 'P1', 'PLAYER', 'rate'],
  ['backhand_unforced_error_rate', '反手非受迫失误率', 'rate', 'rally', 'P1', 'PLAYER', 'rate'],
  ['forehand_winner_count', '正手制胜分数', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['backhand_winner_count', '反手制胜分数', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['short_rally_count', '短回合数量', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['short_rally_win_rate', '短回合得分率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['medium_rally_count', '中回合数量', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['medium_rally_win_rate', '中回合得分率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['long_rally_count', '长回合数量', 'count', 'rally', 'P0', 'PLAYER', 'count'],
  ['long_rally_win_rate', '长回合得分率', 'rate', 'rally', 'P0', 'PLAYER', 'rate'],
  ['first_serve_attempt_count', '一发尝试次数', 'count', 'serve', 'P0', 'PLAYER', 'count'],
  ['first_serve_in_count', '一发成功次数', 'count', 'serve', 'P0', 'PLAYER', 'count'],
  ['first_serve_in_rate', '一发成功率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['first_serve_fault_count', '一发失误次数', 'count', 'serve', 'P0', 'PLAYER', 'count'],
  ['second_serve_attempt_count', '二发尝试次数', 'count', 'serve', 'P0', 'PLAYER', 'count'],
  ['second_serve_in_count', '二发成功次数', 'count', 'serve', 'P0', 'PLAYER', 'count'],
  ['second_serve_in_rate', '二发成功率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['double_fault_rate', '双误率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['ace_rate', 'Ace 率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['service_winner_rate', '发球直接得分率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['first_serve_point_win_rate', '一发得分率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['second_serve_point_win_rate', '二发得分率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['first_serve_avg_speed_mps', '一发平均速度', 'm/s', 'serve', 'P0', 'PLAYER', 'speed_mps'],
  ['second_serve_avg_speed_mps', '二发平均速度', 'm/s', 'serve', 'P0', 'PLAYER', 'speed_mps'],
  ['serve_avg_speed_mps', '总体平均发球速度', 'm/s', 'serve', 'P0', 'PLAYER', 'speed_mps'],
  ['serve_speed_std_mps', '发球速度标准差', 'm/s', 'serve', 'P1', 'PLAYER', 'speed_mps'],
  ['wide_serve_rate', '外角发球使用率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['body_serve_rate', '追身发球使用率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
  ['t_serve_rate', '内角发球使用率', 'rate', 'serve', 'P0', 'PLAYER', 'rate'],
];

export const metricDefinitions: readonly MetricDefinition[] = rows.map(
  ([code, name, unit, dimension, dataTier, playerScope, valueKind]) => ({
    code,
    name,
    unit,
    dimension,
    dataTier,
    playerScope,
    valueKind,
  }),
);

const definitionByCode = new Map(
  metricDefinitions.map((definition) => [definition.code, definition]),
);

export function getMetricDefinition(code: string): MetricDefinition | null {
  return definitionByCode.get(code) ?? null;
}
