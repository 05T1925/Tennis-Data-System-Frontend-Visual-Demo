import {
  demoMatchFixture,
  formatDurationMs,
  formatMetricValue,
  formatSpeedKmh,
  getMetricByCode,
  getOverviewInsights,
  getRallyDistribution,
} from '@tennis-ui/core';
import { Evidence, Meta } from '../components/EditorialBits';
const f = demoMatchFixture;
const scores = ['point_won_count', 'winner_count', 'forced_error_count', 'unforced_error_count'];
export function OverviewPage() {
  const insights = getOverviewInsights(f);
  const a = getRallyDistribution(f, 'A');
  const b = getRallyDistribution(f, 'B');
  return (
    <div className="page report">
      <header className="pageHead">
        <p>FULL MATCH REPORT</p>
        <h1>数据总览</h1>
        <p className="reportLead">比赛，先由回合定义。</p>
      </header>
      <section className="heroNumbers">
        <div>
          <b>{formatMetricValue(getMetricByCode(f, 'point_count', 'ALL'))}</b>
          <span>POINTS</span>
        </div>
        <div>
          <b>{formatMetricValue(getMetricByCode(f, 'shot_count', 'ALL'))}</b>
          <span>SHOTS</span>
        </div>
        <p>
          片段时长 {formatMetricValue(getMetricByCode(f, 'video_duration_ms', 'ALL'))} ·{' '}
          {f.video.title}
        </p>
      </section>
      <section className="splitCompare">
        {(['A', 'B'] as const).map((slot) => (
          <article key={slot}>
            <small>PLAYER {slot}</small>
            <strong>{formatMetricValue(getMetricByCode(f, 'point_win_rate', slot))}</strong>
            {scores.map((code) => {
              const m = getMetricByCode(f, code, slot);
              return (
                <p key={code}>
                  {m?.metricName}
                  <b>{formatMetricValue(m)}</b>
                  <Meta metric={m} />
                </p>
              );
            })}
          </article>
        ))}
      </section>
      <section className="quoteGrid">
        <h2>优势与问题</h2>
        {insights.map((i) => {
          const slots = i.playerSlot === 'ALL' ? (['A', 'B'] as const) : [i.playerSlot];
          return (
            <article key={i.kind + i.title} className={i.kind === 'neutral' ? 'neutral' : 'quote'}>
              <small>{i.kind === 'neutral' ? '双方持平' : `PLAYER ${i.playerSlot}`}</small>
              <h3>{i.title}</h3>
              {slots.map((slot) => {
                const m = getMetricByCode(f, i.evidenceCode, slot);
                return (
                  <p key={slot}>
                    Player {slot} · {formatMetricValue(m)} · <Meta metric={m} />{' '}
                    <Evidence metric={m} />
                  </p>
                );
              })}
            </article>
          );
        })}
      </section>
      <section className="rallyColumns">
        <h2>回合长度</h2>
        {a.map((x, i) => (
          <article key={x.band}>
            <b>{x.band.toUpperCase()}</b>
            <span>样本 {x.count} 个回合</span>
            <p>A {x.winRate === null ? '—' : `${(x.winRate * 100).toFixed(1)}%`}</p>
            <p>B {b[i]!.winRate === null ? '—' : `${(b[i]!.winRate! * 100).toFixed(1)}%`}</p>
          </article>
        ))}
      </section>
      <section className="movementReport">
        <h2>速度与移动</h2>
        <p>移动数据为确定性 Demo，用于三套原型统一比较。</p>
        <div className="movementColumns">
          {(['A', 'B'] as const).map((slot) => (
            <article key={slot}>
              <small>PLAYER {slot}</small>
              {[
                'max_serve_speed_mps',
                'max_shot_speed_mps',
                'total_move_distance_m',
                'avg_move_speed_mps',
                'max_move_speed_mps',
              ].map((code) => {
                const metric = getMetricByCode(f, code, slot);
                const value = code.includes('speed')
                  ? formatSpeedKmh(metric?.metricValue)
                  : formatMetricValue(metric);
                return (
                  <div key={code} className="movementLine">
                    <span>{metric?.metricName}</span>
                    <b>{value}</b>
                    <Meta metric={metric} />
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
      <section className="clipIndex overviewClips">
        <h2>视频证据目录</h2>
        {f.clips.map((clip, index) => (
          <a key={clip.clipId} href={`/video/${f.video.uploadId}?time=${clip.startMs}`}>
            <b>{String(index + 1).padStart(2, '0')}</b>
            <span>{clip.title}</span>
            <time>{formatDurationMs(clip.startMs)}</time>
            <i>→</i>
          </a>
        ))}
      </section>
    </div>
  );
}
