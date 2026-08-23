import {
  demoMatchFixture,
  formatDurationMs,
  formatMetricValue,
  formatSpeedKmh,
  getMetricByCode,
  getOverviewInsights,
  getRallyDistribution,
} from '@tennis-ui/core';
import type { CSSProperties } from 'react';
import type { MetricRecord } from '@tennis-ui/core';
import { Evidence, MetricReadout, Tier } from '../components/LabBits';

const fixture = demoMatchFixture;
const compareCodes = [
  'point_won_count',
  'point_win_rate',
  'winner_count',
  'forced_error_count',
  'unforced_error_count',
];

export const getComparisonWidths = (
  a: Pick<MetricRecord, 'metricUnit' | 'metricValue'> | null,
  b: Pick<MetricRecord, 'metricUnit' | 'metricValue'> | null,
) => {
  const safe = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  const aValue = safe(a?.metricValue);
  const bValue = safe(b?.metricValue);
  if (a?.metricUnit === 'rate' || b?.metricUnit === 'rate') {
    return { a: Math.min(100, aValue * 100), b: Math.min(100, bValue * 100) };
  }
  const maximum = Math.max(aValue, bValue);
  return maximum > 0
    ? { a: (aValue / maximum) * 100, b: (bValue / maximum) * 100 }
    : { a: 0, b: 0 };
};
export function OverviewPage() {
  const rallyA = getRallyDistribution(fixture, 'A');
  const rallyB = getRallyDistribution(fixture, 'B');
  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <p>SESSION / PERFORMANCE MATRIX</p>
        <h1>数据总览</h1>
      </header>
      <section className="session-matrix">
        <div className="matrix-main">
          <span>ACTIVE SESSION</span>
          <b>
            {formatDurationMs(getMetricByCode(fixture, 'active_duration_ms', 'ALL')?.metricValue)}
          </b>
          <small>有效运动时长</small>
        </div>
        {[
          'video_duration_ms',
          'point_count',
          'shot_count',
          'avg_rally_shot_count',
          'max_rally_shot_count',
          'avg_point_duration_ms',
        ].map((code) => (
          <MetricReadout key={code} metric={getMetricByCode(fixture, code, 'ALL')} />
        ))}
      </section>
      <section className="comparison-panel">
        <h2>A/B SCORE MATRIX</h2>
        {compareCodes.map((code) => {
          const a = getMetricByCode(fixture, code, 'A');
          const b = getMetricByCode(fixture, code, 'B');
          const widths = getComparisonWidths(a, b);
          return (
            <div key={code} className="comparison-row" data-metric-code={code}>
              <span>{a?.metricName}</span>
              <div className="comparison-player comparison-player-a">
                <b>A / PLAYER A {formatMetricValue(a)}</b>
                <span
                  className="comparison-track"
                  data-track="A"
                  data-track-width={widths.a.toFixed(2)}
                  style={{ '--value': `${widths.a}%` } as CSSProperties}
                />
              </div>
              <div className="comparison-player comparison-player-b">
                <b>B / PLAYER B {formatMetricValue(b)}</b>
                <span
                  className="comparison-track"
                  data-track="B"
                  data-track-width={widths.b.toFixed(2)}
                  style={{ '--value': `${widths.b}%` } as CSSProperties}
                />
              </div>
              <Tier metric={a} />
              <Tier metric={b} />
            </div>
          );
        })}
      </section>
      <section className="rally-bands">
        <h2>RALLY BANDS</h2>
        {rallyA.map((item, index) => (
          <article key={item.band}>
            <b>{item.band.toUpperCase()}</b>
            <span>共享样本 {item.count} 回合</span>
            <strong>A {item.winRate === null ? '—' : `${(item.winRate * 100).toFixed(1)}%`}</strong>
            <strong>
              B{' '}
              {rallyB[index]!.winRate === null
                ? '—'
                : `${(rallyB[index]!.winRate! * 100).toFixed(1)}%`}
            </strong>
          </article>
        ))}
      </section>
      <section className="lab-insights">
        <h2>OBSERVATION</h2>
        {getOverviewInsights(fixture).map((insight) => (
          <article key={insight.kind + insight.title}>
            <span>
              {insight.kind.toUpperCase()} / {insight.dataTier}
            </span>
            <h3>{insight.title}</h3>
            {(insight.playerSlot === 'ALL' ? (['A', 'B'] as const) : [insight.playerSlot]).map(
              (slot) => {
                const metric = getMetricByCode(fixture, insight.evidenceCode, slot);
                return (
                  <p key={slot}>
                    PLAYER {slot} <b>{formatMetricValue(metric)}</b> <Tier metric={metric} />{' '}
                    <Evidence metric={metric} />
                  </p>
                );
              },
            )}
          </article>
        ))}
      </section>
      <section className="speed-movement">
        <h2>SPEED / MOVEMENT</h2>
        <p>DETERMINISTIC DEMO / 非真实 CV 运动估算</p>
        {(['A', 'B'] as const).map((slot) => (
          <article key={slot}>
            <b>PLAYER {slot}</b>
            {[
              'max_serve_speed_mps',
              'max_shot_speed_mps',
              'total_move_distance_m',
              'avg_move_speed_mps',
              'max_move_speed_mps',
            ].map((code) => {
              const metric = getMetricByCode(fixture, code, slot);
              return (
                <div key={code}>
                  <span>{metric?.metricName}</span>
                  <strong>
                    {code.includes('speed')
                      ? formatSpeedKmh(metric?.metricValue)
                      : formatMetricValue(metric)}
                  </strong>
                  <Tier metric={metric} />
                </div>
              );
            })}
          </article>
        ))}
      </section>
      <section className="evidence-index">
        <h2>CLIP INDEX</h2>
        {fixture.clips.map((clip, index) => (
          <a key={clip.clipId} href={`/video/${fixture.video.uploadId}?time=${clip.startMs}`}>
            <b>C{String(index + 1).padStart(2, '0')}</b>
            <span>{clip.title}</span>
            <time>{formatDurationMs(clip.startMs)}</time>
          </a>
        ))}
      </section>
    </section>
  );
}
