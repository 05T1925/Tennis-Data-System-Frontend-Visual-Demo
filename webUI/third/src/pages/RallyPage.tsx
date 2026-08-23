import {
  demoMatchFixture,
  formatMetricValue,
  formatSpeedKmh,
  formatSpeedMps,
  getMetricByCode,
  getRallyDistribution,
  getShotSpeedSummary,
  parsePlayerSlotParam,
} from '@tennis-ui/core';
import { useSearchParams } from 'react-router-dom';
import { DarkCourt } from '../components/Courts';
import { MetricReadout, PlayerToggle, Tier } from '../components/LabBits';

const fixture = demoMatchFixture;
export function RallyPage() {
  const [params] = useSearchParams();
  const player = parsePlayerSlotParam(params.get('player'));
  const speed = getShotSpeedSummary(fixture, player);
  const rally = getRallyDistribution(fixture, player);
  const hands = [
    ['FOREHAND', '正手', 'forehand_shot_count', 'forehand_shot_rate', 'forehand_in_rate'],
    ['BACKHAND', '反手', 'backhand_shot_count', 'backhand_shot_rate', 'backhand_in_rate'],
  ] as const;
  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <p>SHOT / RALLY / PERFORMANCE</p>
        <h1>击球与相持</h1>
      </header>
      <PlayerToggle player={player} />
      <section className="rally-lab-layout">
        <DarkCourt player={player} />
        <aside className="rally-side">
          <p>
            PLAYER {player} / {fixture.players[player].displayName}
          </p>
          <div className="primary-reading">
            <span>SHOT IN RATE</span>
            <b>{formatMetricValue(getMetricByCode(fixture, 'shot_in_rate', player))}</b>
            <Tier metric={getMetricByCode(fixture, 'shot_in_rate', player)} />
          </div>
          <section className="speed-block">
            <h2>SPEED READOUT</h2>
            {[
              ['AVG', speed.avgSpeedMps],
              ['P90', speed.p90SpeedMps],
              ['MAX', speed.maxSpeedMps],
              ['FOREHAND', speed.forehandAvgSpeedMps],
              ['BACKHAND', speed.backhandAvgSpeedMps],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <b>{formatSpeedKmh(value as number | null)}</b>
                <small>{formatSpeedMps(value as number | null)}</small>
              </div>
            ))}
          </section>
          <section className="side-rally">
            <h2>RALLY BANDS</h2>
            {rally.map((item) => (
              <p key={item.band}>
                <span>
                  {item.band.toUpperCase()} / {item.count}
                </span>
                <b>{item.winRate === null ? '—' : `${(item.winRate * 100).toFixed(1)}%`}</b>
              </p>
            ))}
          </section>
        </aside>
      </section>
      <section className="hand-structure" aria-label="正反手结构">
        <h2>HAND PROFILE</h2>
        {hands.map(([tag, label, countCode, rateCode, inCode]) => {
          const count = getMetricByCode(fixture, countCode, player);
          const rate = getMetricByCode(fixture, rateCode, player);
          const inRate = getMetricByCode(fixture, inCode, player);
          return (
            <article key={tag}>
              <span>{tag}</span>
              <h3>{label}</h3>
              <b>{formatMetricValue(count)}</b>
              <Tier metric={count} />
              <div>
                <span>使用率</span>
                <strong>{formatMetricValue(rate)}</strong>
                <Tier metric={rate} />
              </div>
              <div>
                <span>界内率</span>
                <strong>{formatMetricValue(inRate)}</strong>
                <Tier metric={inRate} />
              </div>
            </article>
          );
        })}
      </section>
      <section className="tier-matrix">
        <article>
          <h2>OUTPUT / P0</h2>
          {['forehand_winner_count', 'backhand_winner_count'].map((code) => (
            <MetricReadout key={code} metric={getMetricByCode(fixture, code, player)} />
          ))}
        </article>
        <article>
          <h2>STABILITY / P1</h2>
          {[
            'unforced_error_rate',
            'forehand_unforced_error_rate',
            'backhand_unforced_error_rate',
            'forced_error_count',
            'unforced_error_count',
          ].map((code) => (
            <MetricReadout key={code} metric={getMetricByCode(fixture, code, player)} />
          ))}
        </article>
      </section>
    </section>
  );
}
