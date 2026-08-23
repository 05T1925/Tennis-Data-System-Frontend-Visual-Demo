import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatSpeedKmh,
  formatSpeedMps,
  getMetricByCode,
  getServeDirectionSummary,
  getServeLandingPoints,
  parsePlayerSlotParam,
} from '@tennis-ui/core';
import {
  EvidenceLink,
  MetricMeta,
  MetricValue,
  PlayerSwitch,
  RatioBar,
  StatsHeader,
} from '../components/StatsShared';
import styles from '../styles/app.module.css';

type ServeFilter = 'all' | 'first' | 'second' | 'deuce' | 'ad';
const fixture = demoMatchFixture;
function ServeCourt({ player }: { player: 'A' | 'B' }) {
  const [filter, setFilter] = useState<ServeFilter>('all');
  const points = useMemo(
    () =>
      getServeLandingPoints(fixture, player).filter(
        (point) => filter === 'all' || point.serveNumber === filter || point.courtSide === filter,
      ),
    [filter, player],
  );
  return (
    <section className={styles.serveCourtModule} aria-labelledby="serve-court-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>SERVE MAP</p>
          <h3 id="serve-court-heading">发球落点</h3>
        </div>
        <span>{points.length} 个样本</span>
      </div>
      <div className={styles.filterRow} aria-label="发球落点筛选">
        {(['all', 'first', 'second', 'deuce', 'ad'] as ServeFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === 'all'
              ? '全部'
              : key === 'first'
                ? '一发'
                : key === 'second'
                  ? '二发'
                  : key === 'deuce'
                    ? 'Deuce'
                    : 'Ad'}
          </button>
        ))}
      </div>
      <svg
        className={styles.serveCourt}
        viewBox="0 0 100 120"
        role="img"
        aria-label={`Player ${player} 发球落点图`}
      >
        <title>Player {player} 发球落点图</title>
        <rect x="5" y="5" width="90" height="110" fill="none" stroke="currentColor" />
        <path d="M5 60h90M50 5v55M18 32h64" fill="none" stroke="currentColor" />
        {points.map((point) =>
          point.outcome === 'fault' ? (
            <path
              key={point.shotId}
              d={`M${point.x * 100 - 3} ${point.y * 120 - 3}l6 6m0-6l-6 6`}
              className={styles.courtError}
            />
          ) : point.outcome === 'service_winner' ? (
            <path
              key={point.shotId}
              d={`M${point.x * 100} ${point.y * 120 - 4}l4 4-4 4-4-4z`}
              className={styles.serveWinner}
            />
          ) : (
            <circle
              key={point.shotId}
              cx={point.x * 100}
              cy={point.y * 120}
              r={point.outcome === 'ace' ? 4 : 2.8}
              className={point.serveNumber === 'first' ? styles.serveFirst : styles.serveSecond}
            />
          ),
        )}
      </svg>
      <p className={styles.courtLegend}>
        ● 一发 / ○ 二发 / × fault / ◆ 发球直接得分；{points.length} 个发球样本，其中{' '}
        {points.filter((point) => point.outcome === 'fault').length} 个 fault，
        {points.filter((point) => point.positionSource === 'end').length} 个缺少 bouncePoint 后使用
        endPoint 示意位置。
      </p>
    </section>
  );
}
export function ServePage() {
  const [params] = useSearchParams();
  const player = parsePlayerSlotParam(params.get('player'));
  const direction = getServeDirectionSummary(fixture, player);
  const firstCodes = [
    'first_serve_attempt_count',
    'first_serve_in_count',
    'first_serve_in_rate',
    'first_serve_fault_count',
    'first_serve_point_win_rate',
  ];
  const secondCodes = [
    'second_serve_attempt_count',
    'second_serve_in_count',
    'second_serve_in_rate',
    'second_serve_point_win_rate',
  ];
  const speedCodes = [
    'first_serve_avg_speed_mps',
    'second_serve_avg_speed_mps',
    'serve_avg_speed_mps',
    'max_serve_speed_mps',
    'serve_speed_std_mps',
  ];
  return (
    <div className={styles.statsPage}>
      <StatsHeader
        title="发球分析"
        description="将一二发质量、发球结果、速度、方向和落点串联到共享视频证据。"
        player={player}
      />
      <PlayerSwitch player={player} />
      <section className={styles.serveComparison}>
        <article>
          <p className={styles.kicker}>FIRST SERVE</p>
          <h3>一发</h3>
          {firstCodes.map((code) => {
            const metric = getMetricByCode(fixture, code, player);
            return (
              <div key={code}>
                <span>{metric?.metricName}</span>
                <MetricValue metric={metric} />
                <MetricMeta metric={metric} />
                {metric?.metricUnit === 'rate' ? (
                  <RatioBar label={metric.metricName} value={metric.metricValue} />
                ) : null}
              </div>
            );
          })}
        </article>
        <article>
          <p className={styles.kicker}>SECOND SERVE</p>
          <h3>二发</h3>
          {secondCodes.map((code) => {
            const metric = getMetricByCode(fixture, code, player);
            return (
              <div key={code}>
                <span>{metric?.metricName}</span>
                <MetricValue metric={metric} />
                <MetricMeta metric={metric} />
                {metric?.metricUnit === 'rate' ? (
                  <RatioBar label={metric.metricName} value={metric.metricValue} />
                ) : null}
              </div>
            );
          })}
        </article>
      </section>
      <section className={styles.serveResultRow}>
        {(['ace_rate', 'service_winner_rate', 'double_fault_rate'] as const).map((code) => {
          const metric = getMetricByCode(fixture, code, player);
          return (
            <article key={code}>
              <span>{metric?.metricName}</span>
              <MetricValue metric={metric} />
              <MetricMeta metric={metric} />
              <EvidenceLink metric={metric} />
            </article>
          );
        })}
      </section>
      <section className={styles.rallyPageGrid}>
        <section className={styles.speedBand}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>SERVE SPEED</p>
              <h3>速度层级</h3>
            </div>
          </div>
          {speedCodes.map((code) => {
            const metric = getMetricByCode(fixture, code, player);
            return (
              <div key={code}>
                <span>{metric?.metricName}</span>
                <strong>{formatSpeedKmh(metric?.metricValue ?? null)}</strong>
                <span className={styles.speedMeta}>
                  {formatSpeedMps(metric?.metricValue ?? null)} · <MetricMeta metric={metric} />
                </span>
              </div>
            );
          })}
          <p className={styles.disclosure}>发球速度标准差为 P1 规则推断。</p>
        </section>
        <section className={styles.directionModule}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>DIRECTION</p>
              <h3>方向分布</h3>
            </div>
            <span>{direction[0]?.sampleSize ?? 0} 个明确方向样本</span>
          </div>
          {direction.map((item) => (
            <article key={item.direction}>
              <div>
                <strong>
                  {item.direction === 'wide' ? '外角' : item.direction === 'body' ? '追身' : '内角'}
                </strong>
                <small>{item.count} 次</small>
              </div>
              <RatioBar label={`${item.direction} 发球率`} value={item.rate} />
            </article>
          ))}
        </section>
      </section>
      <section className={styles.rallyPageGrid}>
        <ServeCourt player={player} />
        <section className={styles.serveEvidence}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>VIDEO EVIDENCE</p>
              <h3>视频证据</h3>
            </div>
          </div>
          {[
            'max_serve_speed_mps',
            'ace_rate',
            'service_winner_rate',
            'second_serve_in_rate',
            'double_fault_rate',
          ].map((code) => {
            const metric = getMetricByCode(fixture, code, player);
            return (
              <article key={code}>
                <div>
                  <span>{metric?.metricName}</span>
                  <MetricMeta metric={metric} />
                </div>
                <MetricValue metric={metric} />
                <EvidenceLink metric={metric} />
              </article>
            );
          })}
          <p className={styles.disclosure}>零事件仅提供同球员样本，不跳转对手片段。</p>
        </section>
      </section>
      <section className={styles.clipStrip}>
        {fixture.clips
          .filter((clip) => clip.type === 'serve')
          .map((clip) => (
            <Link key={clip.clipId} to={`/video/${fixture.video.uploadId}?time=${clip.startMs}`}>
              {clip.title}
              <small>查看片段</small>
            </Link>
          ))}
      </section>
    </div>
  );
}
