import type { ClipRef, PointRecord, ShotRecord } from '@tennis-ui/core';

export const endReasonLabel: Record<PointRecord['endReason'], string> = {
  ace: 'Ace',
  service_winner: '发球直接得分',
  winner: '制胜分',
  double_fault: '双误',
  forced_error: '受迫失误',
  unforced_error: '非受迫失误',
  net: '下网',
  long: '出界过长',
  wide: '出界过宽',
  unknown: '未知',
};

export const strokeLabel: Record<ShotRecord['strokeType'], string> = {
  serve: '发球',
  forehand: '正手',
  backhand: '反手',
  volley: '截击',
  unknown: '未识别',
};

export const resultLabel: Record<ShotRecord['result'], string> = {
  in: '界内',
  winner: '制胜',
  net: '下网',
  long: '出界过长',
  wide: '出界过宽',
  unknown: '未识别',
};

export const clipTypeLabel: Record<ClipRef['type'], string> = {
  serve: '发球',
  long_rally: '长回合',
  winner: '制胜分',
  error: '失误',
  highlight: '高光',
};

export const formatClock = (timeMs: number): string => {
  const seconds = Math.max(0, Math.floor(timeMs / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export const confidenceLabel = (confidence: number): string =>
  confidence >= 0.85 ? '高' : confidence >= 0.7 ? '中' : '低';

export const safeFileName = (name: string): string =>
  name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
