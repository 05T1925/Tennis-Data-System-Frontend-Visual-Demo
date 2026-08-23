import {
  demoMatchFixture,
  formatMetricValue,
  formatSpeedKmh,
  getMetricByCode,
  getRallyDistribution,
  getShotSpeedSummary,
  parsePlayerSlotParam,
} from '@tennis-ui/core';
import { useSearchParams } from 'react-router-dom';
import { Court } from '../components/Courts';
import { Meta, MetricLine, PlayerTabs } from '../components/EditorialBits';
const f = demoMatchFixture;
export function RallyPage() {
  const [p] = useSearchParams(),
    player = parsePlayerSlotParam(p.get('player')),
    speed = getShotSpeedSummary(f, player),
    rally = getRallyDistribution(f, player);
  return (
    <div className="page">
      <header className="pageHead compactHead">
        <p>SHOT &amp; RALLY REPORT</p>
        <h1>击球与相持</h1>
      </header>
      <PlayerTabs player={player} />
      <section className="rallyLead">
        <div>
          <p>PLAYER {player}</p>
          <h2 className="playerName">{f.players[player].displayName}</h2>
          <strong>{formatMetricValue(getMetricByCode(f, 'shot_in_rate', player))}</strong>
          <span>总界内率</span>
          <p>最大非发球击球速度 {formatSpeedKmh(speed.maxSpeedMps)}</p>
        </div>
        <Court player={player} />
      </section>
      <section className="handProfile" aria-label="正反手结构">
        {(
          [
            ['forehand', '正手', 'forehand_shot_count', 'forehand_shot_rate', 'forehand_in_rate'],
            ['backhand', '反手', 'backhand_shot_count', 'backhand_shot_rate', 'backhand_in_rate'],
          ] as const
        ).map(([kind, label, countCode, rateCode, inCode]) => {
          const count = getMetricByCode(f, countCode, player);
          const rate = getMetricByCode(f, rateCode, player);
          const inRate = getMetricByCode(f, inCode, player);
          return (
            <article key={kind} className={kind}>
              <small>{kind.toUpperCase()}</small>
              <h2>{label}</h2>
              <strong>{formatMetricValue(count)}</strong>
              <Meta metric={count} />
              <p>
                <span>
                  使用率 <Meta metric={rate} />
                </span>
                <b>{formatMetricValue(rate)}</b>
              </p>
              <p>
                <span>
                  界内率 <Meta metric={inRate} />
                </span>
                <b>{formatMetricValue(inRate)}</b>
              </p>
            </article>
          );
        })}
        <div className="totalHandRate">
          <span>总界内率</span>
          <b>{formatMetricValue(getMetricByCode(f, 'shot_in_rate', player))}</b>
        </div>
      </section>
      <section className="editorialTable">
        <h2>速度读数</h2>
        {[
          ['AVG', speed.avgSpeedMps],
          ['P90', speed.p90SpeedMps],
          ['MAX', speed.maxSpeedMps],
          ['FOREHAND', speed.forehandAvgSpeedMps],
          ['BACKHAND', speed.backhandAvgSpeedMps],
        ].map(([l, v]) => (
          <p key={String(l)}>
            <span>{l}</span>
            <b>{formatSpeedKmh(v as number | null)}</b>
          </p>
        ))}
      </section>
      <section className="twoColumns">
        <div>
          <h2>
            制胜分产出 <small>P0</small>
          </h2>
          {['forehand_winner_count', 'backhand_winner_count'].map((c) => (
            <MetricLine key={c} metric={getMetricByCode(f, c, player)} />
          ))}
        </div>
        <div>
          <h2>
            稳定性与失误 <small>P1</small>
          </h2>
          {[
            'unforced_error_rate',
            'forehand_unforced_error_rate',
            'backhand_unforced_error_rate',
            'forced_error_count',
            'unforced_error_count',
          ].map((c) => (
            <MetricLine key={c} metric={getMetricByCode(f, c, player)} />
          ))}
        </div>
      </section>
      <section className="rallyColumns">
        <h2>相持表现</h2>
        {rally.map((x) => (
          <article key={x.band}>
            <b>{x.band}</b>
            <span>{x.count} 个回合</span>
            <p>{x.winRate === null ? '—' : `${(x.winRate * 100).toFixed(1)}% 得分率`}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
