import { Link, useSearchParams } from 'react-router-dom';
import {
  formatConfidence,
  formatMetricValue,
  formatSampleSize,
  getEvidenceForMetric,
  type MetricRecord,
  type PlayerSlot,
  demoMatchFixture,
} from '@tennis-ui/core';
import styles from '../styles/app.module.css';

export function StatsHeader({
  title,
  description,
  player,
}: {
  title: string;
  description: string;
  player?: PlayerSlot;
}) {
  return (
    <header className={styles.statsHeader}>
      <div>
        <p className={styles.kicker}>比赛统计</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className={styles.statsMeta}>
        <span>Mock 数据</span>
        <span>{demoMatchFixture.video.algorithmVersion}</span>
        <span>{demoMatchFixture.video.title}</span>
        {player ? <span>Player {player}</span> : null}
        <Link to={`/video/${demoMatchFixture.video.uploadId}`}>返回视频详情</Link>
      </div>
    </header>
  );
}

export function PlayerSwitch({ player }: { player: PlayerSlot }) {
  const [params, setParams] = useSearchParams();
  return (
    <div className={styles.playerSwitch} aria-label="选择球员">
      {(['A', 'B'] as const).map((slot) => (
        <button
          key={slot}
          type="button"
          aria-pressed={player === slot}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('player', slot);
            setParams(next, { replace: true });
          }}
        >
          <strong>Player {slot}</strong>
          <span>
            {slot === 'A'
              ? demoMatchFixture.players.A.displayName
              : demoMatchFixture.players.B.displayName}
          </span>
        </button>
      ))}
    </div>
  );
}

export function MetricMeta({ metric }: { metric: MetricRecord | null }) {
  if (!metric) return <span className={styles.metricMeta}>—</span>;
  return (
    <span className={styles.metricMeta}>
      {formatSampleSize(metric.sampleSize)} ·{' '}
      <span className={`${styles.tierBadge} ${metric.dataTier === 'P1' ? styles.tierP1 : ''}`}>
        {metric.dataTier}
      </span>
      {metric.dataTier === 'P1' ? ` · ${formatConfidence(metric.confidence)}` : ''}
    </span>
  );
}

export function MetricValue({ metric }: { metric: MetricRecord | null }) {
  return <strong className={styles.metricNumber}>{formatMetricValue(metric)}</strong>;
}

export function EvidenceLink({ metric }: { metric: MetricRecord | null }) {
  if (!metric) return null;
  const evidence = getEvidenceForMetric(demoMatchFixture, metric)[0];
  if (!evidence) return null;
  const sample = metric.metricValue === 0 && evidence.label.includes('样本');
  return (
    <Link
      className={styles.evidenceLink}
      to={`/video/${demoMatchFixture.video.uploadId}?time=${evidence.clipStartMs}`}
    >
      {sample ? '查看样本' : '查看证据'} <span>{metric.evidenceIds.length}</span>
    </Link>
  );
}

export function RatioBar({ value, label }: { value: number | null; label: string }) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value * 100));
  return (
    <div className={styles.ratioWrap}>
      <div className={styles.ratioTrack} aria-label={`${label} ${width.toFixed(1)}%`}>
        <span style={{ width: `${width}%` }} />
      </div>
      <small>{value === null ? '—' : `${width.toFixed(1)}%`}</small>
    </div>
  );
}
