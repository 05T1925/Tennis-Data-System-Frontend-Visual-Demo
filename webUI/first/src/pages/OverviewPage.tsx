import { Link } from 'react-router-dom';
import {
  demoMatchFixture,
  formatMetricValue,
  getMetricByCode,
  getOverviewInsights,
  getRallyDistribution,
} from '@tennis-ui/core';
import {
  EvidenceLink,
  MetricMeta,
  MetricValue,
  RatioBar,
  StatsHeader,
} from '../components/StatsShared';
import styles from '../styles/app.module.css';

const fixture = demoMatchFixture;
const globalCodes = [
  'video_duration_ms',
  'active_duration_ms',
  'point_count',
  'shot_count',
  'avg_rally_shot_count',
  'max_rally_shot_count',
  'avg_point_duration_ms',
];
const scoringCodes = [
  'point_won_count',
  'point_lost_count',
  'point_win_rate',
  'winner_count',
  'forced_error_count',
  'unforced_error_count',
];
const playerName = (slot: 'A' | 'B') => fixture.players[slot].displayName;
const bandLabel = { short: '短回合 · 1–4 拍', medium: '中回合 · 5–8 拍', long: '长回合 · 9+ 拍' };
type OverviewInsight = ReturnType<typeof getOverviewInsights>[number];

export function OverviewInsightCard({ insight }: { insight: OverviewInsight }) {
  if (insight.kind === 'neutral') {
    const neutralMetrics = (['A', 'B'] as const).map((slot) => ({
      slot,
      metric: getMetricByCode(fixture, insight.evidenceCode, slot),
    }));
    return (
      <article className={styles.insightNeutral} data-testid="neutral-insight">
        <span>本场观察 · 双方持平</span>
        <strong>{insight.title}</strong>
        <p>两类主要失误指标未出现球员差异，分别查看双方样本。</p>
        <div className={styles.neutralMetricList}>
          {neutralMetrics.map(({ slot, metric }) => (
            <div key={slot}>
              <span>Player {slot}</span>
              <MetricValue metric={metric} />
              <MetricMeta metric={metric} />
              <EvidenceLink metric={metric} />
            </div>
          ))}
        </div>
      </article>
    );
  }
  const metric = getMetricByCode(fixture, insight.evidenceCode, insight.playerSlot);
  return (
    <article
      className={insight.kind === 'advantage' ? styles.insightAdvantage : styles.insightIssue}
    >
      <span>
        {insight.kind === 'advantage' ? '本场优势' : `本场问题 · Player ${insight.playerSlot}`}
      </span>
      <strong>{insight.title}</strong>
      <p>
        依据：{formatMetricValue(metric)}，{metric?.sampleSize ?? 0} 个样本，{insight.dataTier}。
      </p>
      <EvidenceLink metric={metric} />
    </article>
  );
}

export function OverviewPage() {
  const insights = getOverviewInsights(fixture);
  const rallyA = getRallyDistribution(fixture, 'A');
  const rallyB = getRallyDistribution(fixture, 'B');
  return (
    <div className={styles.statsPage}>
      <StatsHeader
        title="数据总览"
        description="从整场规模、得分结构到回合长度，先确定可追溯的结论。"
      />
      <section className={styles.overviewScale} aria-label="比赛规模摘要">
        {globalCodes.map((code, index) => {
          const metric = getMetricByCode(fixture, code, 'ALL');
          return (
            <article key={code} className={index < 2 ? styles.scalePrimary : ''}>
              <span>{metric?.metricName}</span>
              <MetricValue metric={metric} />
              <MetricMeta metric={metric} />
            </article>
          );
        })}
      </section>
      <section className={styles.overviewMainGrid}>
        <section className={styles.scoreComparison} aria-labelledby="score-comparison">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>A / B 结果</p>
              <h3 id="score-comparison">得分结构对比</h3>
            </div>
            <span>普通制胜分不含 Ace 与发球直接得分</span>
          </div>
          <div className={styles.scoreSplit}>
            {(['A', 'B'] as const).map((slot) => {
              const winRate = getMetricByCode(fixture, 'point_win_rate', slot);
              return (
                <article
                  key={slot}
                  className={slot === 'A' ? styles.playerColumnA : styles.playerColumnB}
                >
                  <div>
                    <span>Player {slot}</span>
                    <h4>{playerName(slot)}</h4>
                  </div>
                  <MetricValue metric={winRate} />
                  <RatioBar label={`${slot} 总得分率`} value={winRate?.metricValue ?? null} />
                  <MetricMeta metric={winRate} />
                </article>
              );
            })}
          </div>
          <div className={styles.comparisonRows}>
            {scoringCodes
              .filter((code) => code !== 'point_win_rate')
              .map((code) => (
                <div key={code}>
                  <span>{getMetricByCode(fixture, code, 'A')?.metricName}</span>
                  {(['A', 'B'] as const).map((slot) => {
                    const metric = getMetricByCode(fixture, code, slot);
                    return (
                      <article key={slot}>
                        <strong>{formatMetricValue(metric)}</strong>
                        <MetricMeta metric={metric} />
                        <EvidenceLink metric={metric} />
                      </article>
                    );
                  })}
                </div>
              ))}
          </div>
          <p className={styles.disclosure}>P1 规则推断基于演示 Fixture，不代表真实 CV 结论。</p>
        </section>
        <section className={styles.insightStack} aria-label="结论与问题">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>结论</p>
              <h3>优势与问题</h3>
            </div>
          </div>
          {insights.map((insight) => (
            <OverviewInsightCard key={`${insight.kind}-${insight.playerSlot}`} insight={insight} />
          ))}
        </section>
      </section>
      <section className={styles.rallyComparison} aria-labelledby="rally-comparison">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>RALLY LENGTH</p>
            <h3 id="rally-comparison">回合长度与得分率</h3>
          </div>
          <span>数量与胜率分别表达</span>
        </div>
        {rallyA.map((itemA, index) => {
          const itemB = rallyB[index]!;
          return (
            <article key={itemA.band}>
              <div>
                <strong>{bandLabel[itemA.band]}</strong>
                <small>样本：{itemA.count} 个回合</small>
              </div>
              <div className={styles.rallyRate}>
                <span>Player A 得分率</span>
                <RatioBar label={`Player A ${itemA.band} 得分率`} value={itemA.winRate} />
              </div>
              <div className={styles.rallyRate}>
                <span>Player B 得分率</span>
                <RatioBar label={`Player B ${itemB.band} 得分率`} value={itemB.winRate} />
              </div>
            </article>
          );
        })}
      </section>
      <section className={styles.secondaryOverview}>
        <div>
          <p className={styles.kicker}>速度与移动</p>
          <h3>次级运动概览</h3>
          <p>移动值是确定性 Demo 数据，不代表真实追踪。</p>
        </div>
        {[
          'max_serve_speed_mps',
          'max_shot_speed_mps',
          'total_move_distance_m',
          'avg_move_speed_mps',
          'max_move_speed_mps',
        ].map((code) => (
          <article key={code}>
            <span>{getMetricByCode(fixture, code, 'A')?.metricName}</span>
            <strong>A {formatMetricValue(getMetricByCode(fixture, code, 'A'))}</strong>
            <strong>B {formatMetricValue(getMetricByCode(fixture, code, 'B'))}</strong>
          </article>
        ))}
      </section>
      <section className={styles.clipStrip} aria-label="关键视频入口">
        {fixture.clips.map((clip) => (
          <Link key={clip.clipId} to={`/video/${fixture.video.uploadId}?time=${clip.startMs}`}>
            <span>{clip.title}</span>
            <small>Point {clip.pointId?.replace('point-', '')}</small>
          </Link>
        ))}
      </section>
    </div>
  );
}
