import { Link, useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatConfidence,
  formatMetricValue,
  formatSpeedKmh,
  formatSpeedMps,
  formatSampleSize,
  getEvidenceForMetric,
  type MetricRecord,
  type PlayerSlot,
} from '@tennis-ui/core';
export const fixture = demoMatchFixture;
export function Meta({ metric }: { metric: MetricRecord | null }) {
  return (
    <span className="meta">
      {metric
        ? `${formatSampleSize(metric.sampleSize)} · ${metric.dataTier}${metric.dataTier === 'P1' ? ` · ${formatConfidence(metric.confidence)}` : ''}`
        : '—'}
    </span>
  );
}
export function Evidence({ metric }: { metric: MetricRecord | null }) {
  const ev = metric && getEvidenceForMetric(fixture, metric)[0];
  if (!ev) return null;
  return (
    <Link className="evidence" to={`/video/${fixture.video.uploadId}?time=${ev.clipStartMs}`}>
      {metric.metricValue === 0 && ev.label.includes('样本') ? '查看样本' : '查看证据'} →
    </Link>
  );
}
export function PlayerTabs({ player }: { player: PlayerSlot }) {
  const [params, setParams] = useSearchParams();
  return (
    <div className="playerTabs" aria-label="球员切换">
      {(['A', 'B'] as const).map((slot) => (
        <button
          key={slot}
          aria-pressed={slot === player}
          onClick={() => {
            const n = new URLSearchParams(params);
            n.set('player', slot);
            setParams(n, { replace: true });
          }}
        >
          PLAYER {slot}
        </button>
      ))}
    </div>
  );
}
export function MetricLine({ metric }: { metric: MetricRecord | null }) {
  return (
    <div className="metricLine">
      <span>{metric?.metricName}</span>
      <b>{formatMetricValue(metric)}</b>
      <Meta metric={metric} />
      <Evidence metric={metric} />
    </div>
  );
}

export function SpeedMetricLine({ metric }: { metric: MetricRecord | null }) {
  return (
    <div className="metricLine speedMetricLine">
      <span>{metric?.metricName}</span>
      <b>{formatSpeedKmh(metric?.metricValue)}</b>
      <span className="secondaryUnit">{formatSpeedMps(metric?.metricValue)}</span>
      <Meta metric={metric} />
      <Evidence metric={metric} />
    </div>
  );
}
