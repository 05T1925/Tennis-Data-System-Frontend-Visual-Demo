import { Link, useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatConfidence,
  formatMetricValue,
  formatSampleSize,
  formatSpeedKmh,
  formatSpeedMps,
  getEvidenceForMetric,
  type MetricRecord,
  type PlayerSlot,
} from '@tennis-ui/core';

export const fixture = demoMatchFixture;
export function Tier({ metric }: { metric: MetricRecord | null }) {
  return (
    <small className="tier">
      {metric
        ? `${formatSampleSize(metric.sampleSize)} / ${metric.dataTier}${metric.dataTier === 'P1' ? ` / ${formatConfidence(metric.confidence)}` : ''}`
        : '—'}
    </small>
  );
}
export function Evidence({ metric }: { metric: MetricRecord | null }) {
  const evidence = metric ? getEvidenceForMetric(fixture, metric)[0] : null;
  if (!evidence) return null;
  return (
    <Link className="evidence" to={`/video/${fixture.video.uploadId}?time=${evidence.clipStartMs}`}>
      {metric?.metricValue === 0 ? '查看样本' : '查看证据'} →
    </Link>
  );
}
export function MetricReadout({
  metric,
  speed = false,
}: {
  metric: MetricRecord | null;
  speed?: boolean;
}) {
  return (
    <div className="metric-readout">
      <span>{metric?.metricName ?? '—'}</span>
      <b>{speed ? formatSpeedKmh(metric?.metricValue) : formatMetricValue(metric)}</b>
      {speed ? <em>{formatSpeedMps(metric?.metricValue)}</em> : null}
      <Tier metric={metric} />
      <Evidence metric={metric} />
    </div>
  );
}
export function PlayerToggle({ player }: { player: PlayerSlot }) {
  const [params, setParams] = useSearchParams();
  return (
    <div className="player-toggle" aria-label="球员切换">
      {(['A', 'B'] as const).map((slot) => (
        <button
          key={slot}
          aria-pressed={player === slot}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('player', slot);
            setParams(next, { replace: true });
          }}
        >
          <b>{slot}</b> / PLAYER {slot}
        </button>
      ))}
    </div>
  );
}
export const speedValue = (value: number | null | undefined) => (
  <>
    <b>{formatSpeedKmh(value)}</b>
    <small>{formatSpeedMps(value)}</small>
  </>
);
