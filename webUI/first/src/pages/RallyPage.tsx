import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatMetricValue,
  formatSpeedKmh,
  formatSpeedMps,
  getLandingPointsByPlayer,
  getMetricByCode,
  getRallyDistribution,
  getShotSpeedSummary,
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

type LandingFilter = 'all' | 'forehand' | 'backhand' | 'winner' | 'error';
const fixture = demoMatchFixture;
const labels: Record<LandingFilter, string> = {
  all: '全部',
  forehand: '正手',
  backhand: '反手',
  winner: '制胜分',
  error: '失误',
};

function TennisCourt({ player }: { player: 'A' | 'B' }) {
  const [filter, setFilter] = useState<LandingFilter>('all');
  const points = useMemo(
    () =>
      getLandingPointsByPlayer(fixture, player).filter(
        (point) =>
          filter === 'all' ||
          (filter === 'forehand' || filter === 'backhand'
            ? point.strokeType === filter
            : filter === 'winner'
              ? point.result === 'winner'
              : point.isError),
      ),
    [filter, player],
  );
  return (
    <section className={styles.courtModule} aria-labelledby="court-heading">
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>LANDING</p>
          <h3 id="court-heading">击球落点</h3>
        </div>
        <span>{points.length} 个有效落点</span>
      </div>
      <div className={styles.filterRow} aria-label="落点筛选">
        {(Object.keys(labels) as LandingFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {labels[key]}
          </button>
        ))}
      </div>
      <svg
        className={styles.tennisCourt}
        viewBox="0 0 100 160"
        role="img"
        aria-label={`Player ${player} 网球场落点图`}
      >
        <title>Player {player} 击球落点</title>
        <rect x="5" y="5" width="90" height="150" fill="none" stroke="currentColor" />
        <path d="M5 80h90M50 5v150M5 42h90M5 118h90" fill="none" stroke="currentColor" />
        <path d="M5 80h90" strokeWidth="2" />
        {points.map((point) =>
          point.result === 'winner' ? (
            <circle
              key={point.shotId}
              cx={point.x * 100}
              cy={point.y * 160}
              r="3.2"
              className={styles.courtWinner}
            />
          ) : point.isError ? (
            <path
              key={point.shotId}
              d={`M${point.x * 100 - 3} ${point.y * 160 - 3}l6 6m0-6l-6 6`}
              className={styles.courtError}
            />
          ) : (
            <rect
              key={point.shotId}
              x={point.x * 100 - 2.3}
              y={point.y * 160 - 2.3}
              width="4.6"
              height="4.6"
              className={
                point.strokeType === 'forehand' ? styles.courtForehand : styles.courtBackhand
              }
            />
          ),
        )}
      </svg>
      <p className={styles.courtLegend}>
        ■ 正手 / ◇ 反手 / ● 制胜分 / × 失误。{points.length} 个落点，其中{' '}
        {points.filter((point) => point.isError).length} 个失误，
        {points.filter((point) => point.positionSource === 'end').length} 个缺少 bouncePoint 后使用
        endPoint 示意位置。
      </p>
    </section>
  );
}

export function RallyPage() {
  const [params] = useSearchParams();
  const player = parsePlayerSlotParam(params.get('player'));
  const name = fixture.players[player].displayName;
  const speed = getShotSpeedSummary(fixture, player);
  const rally = getRallyDistribution(fixture, player);
  const handCodes = [
    'forehand_shot_count',
    'forehand_shot_rate',
    'forehand_in_rate',
    'backhand_shot_count',
    'backhand_shot_rate',
    'backhand_in_rate',
  ];
  const p0WinnerCodes = ['forehand_winner_count', 'backhand_winner_count'];
  const p1StabilityCodes = [
    'unforced_error_rate',
    'forehand_unforced_error_rate',
    'backhand_unforced_error_rate',
    'forced_error_count',
    'unforced_error_count',
  ];
  return (
    <div className={styles.statsPage}>
      <StatsHeader
        title="击球与相持"
        description="从拍型结构、稳定性、速度和落点理解当前球员的回合表现。"
        player={player}
      />
      <PlayerSwitch player={player} />
      <section className={styles.rallyHero}>
        <div>
          <p className={styles.kicker}>PLAYER {player}</p>
          <h3>{name} 的击球结构</h3>
          <p>
            总界内率{' '}
            <strong>{formatMetricValue(getMetricByCode(fixture, 'shot_in_rate', player))}</strong>
            ，最大非发球击球速度 <strong>{formatSpeedKmh(speed.maxSpeedMps)}</strong>。
          </p>
        </div>
        <div className={styles.handBalance}>
          {(['forehand', 'backhand'] as const).map((hand) => {
            const count = getMetricByCode(fixture, `${hand}_shot_count`, player);
            const rate = getMetricByCode(fixture, `${hand}_shot_rate`, player);
            const inRate = getMetricByCode(fixture, `${hand}_in_rate`, player);
            return (
              <article key={hand}>
                <span>{hand === 'forehand' ? '正手' : '反手'}</span>
                <MetricValue metric={count} />
                <RatioBar label={`${hand} 使用率`} value={rate?.metricValue ?? null} />
                <small>界内 {formatMetricValue(inRate)}</small>
              </article>
            );
          })}
        </div>
      </section>
      <section className={styles.rallyPageGrid}>
        <section className={styles.handDetails}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>STRIKE PROFILE</p>
              <h3>正反手质量</h3>
            </div>
          </div>
          {handCodes.map((code) => {
            const metric = getMetricByCode(fixture, code, player);
            return (
              <article key={code}>
                <span>{metric?.metricName}</span>
                <MetricValue metric={metric} />
                <MetricMeta metric={metric} />
              </article>
            );
          })}
        </section>
        <section className={styles.speedBand}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>SPEED BAND</p>
              <h3>非发球速度</h3>
            </div>
            <span>{speed.sampleSize} 个样本</span>
          </div>
          {[
            ['平均速度', speed.avgSpeedMps],
            ['P90 速度', speed.p90SpeedMps],
            ['正手平均', speed.forehandAvgSpeedMps],
            ['反手平均', speed.backhandAvgSpeedMps],
            ['最大速度', speed.maxSpeedMps],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <span>{label}</span>
              <strong>{formatSpeedKmh(value as number | null)}</strong>
              <small>{formatSpeedMps(value as number | null)}</small>
            </div>
          ))}
        </section>
      </section>
      <section className={styles.rallyPageGrid}>
        <TennisCourt player={player} />
        <div className={styles.rallyAnalysisStack}>
          <section className={styles.winnerModule}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>ATTACK OUTPUT</p>
                <h3>制胜分产出</h3>
              </div>
              <span>P0 直接统计</span>
            </div>
            {p0WinnerCodes.map((code) => {
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
          </section>
          <section className={styles.stabilityModule}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>STABILITY</p>
                <h3>稳定性与失误</h3>
              </div>
              <span>规则推断</span>
            </div>
            {p1StabilityCodes.map((code) => {
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
            <p className={styles.disclosure}>P1 基于演示规则生成，不代表真实 CV 结论。</p>
          </section>
        </div>
      </section>
      <section className={styles.playerRallyBands}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>RALLY PERFORMANCE</p>
            <h3>回合表现结构</h3>
          </div>
        </div>
        {rally.map((item) => (
          <article key={item.band}>
            <div>
              <strong>
                {item.band === 'short' ? '短回合' : item.band === 'medium' ? '中回合' : '长回合'}
              </strong>
              <small>{item.count} 个样本</small>
            </div>
            <RatioBar label={`${item.band} 得分率`} value={item.winRate} />
            <span>
              {item.winRate === null ? '—' : `${(item.winRate * 100).toFixed(1)}% 得分率`}
            </span>
          </article>
        ))}
      </section>
      <section className={styles.clipStrip}>
        {fixture.clips
          .filter((clip) => clip.type !== 'serve')
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
