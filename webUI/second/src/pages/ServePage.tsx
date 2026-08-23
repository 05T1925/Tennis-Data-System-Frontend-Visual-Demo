import {
  demoMatchFixture,
  formatMetricValue,
  getMetricByCode,
  getServeDirectionSummary,
  parsePlayerSlotParam,
} from '@tennis-ui/core';
import { useSearchParams } from 'react-router-dom';
import { ServeCourt } from '../components/Courts';
import { MetricLine, PlayerTabs, SpeedMetricLine } from '../components/EditorialBits';
const f = demoMatchFixture;
export function ServePage() {
  const [p] = useSearchParams(),
    player = parsePlayerSlotParam(p.get('player')),
    dir = getServeDirectionSummary(f, player);
  const serve = (codes: string[]) =>
    codes.map((c) =>
      c.endsWith('_speed_mps') ? (
        <SpeedMetricLine key={c} metric={getMetricByCode(f, c, player)} />
      ) : (
        <MetricLine key={c} metric={getMetricByCode(f, c, player)} />
      ),
    );
  return (
    <div className="page">
      <header className="pageHead compactHead">
        <p>SERVICE REPORT</p>
        <h1>发球分析</h1>
      </header>
      <PlayerTabs player={player} />
      <section className="serveDuo">
        <article>
          <p>FIRST</p>
          <strong>{formatMetricValue(getMetricByCode(f, 'first_serve_in_rate', player))}</strong>
          <h2 className="serveTitle">一发</h2>
          {serve([
            'first_serve_attempt_count',
            'first_serve_in_count',
            'first_serve_point_win_rate',
            'first_serve_avg_speed_mps',
          ])}
        </article>
        <article>
          <p>SECOND</p>
          <strong>{formatMetricValue(getMetricByCode(f, 'second_serve_in_rate', player))}</strong>
          <h2 className="serveTitle">二发</h2>
          {serve([
            'second_serve_attempt_count',
            'second_serve_in_count',
            'second_serve_point_win_rate',
            'second_serve_avg_speed_mps',
          ])}
        </article>
      </section>
      <section className="rallyColumns">
        <h2>发球结果</h2>
        {['ace_rate', 'service_winner_rate', 'double_fault_rate'].map((c) => {
          const m = getMetricByCode(f, c, player);
          return (
            <article key={c}>
              <MetricLine metric={m} />
            </article>
          );
        })}
      </section>
      <section className="twoColumns">
        <ServeCourt player={player} />
        <div className="editorialTable">
          <h2>方向与速度</h2>
          {dir.map((x) => (
            <p key={x.direction}>
              <span>
                {x.direction.toUpperCase()} · {x.count} 次
              </span>
              <b>{x.rate === null ? '—' : `${(x.rate * 100).toFixed(1)}%`}</b>
            </p>
          ))}
          {['serve_avg_speed_mps', 'max_serve_speed_mps', 'serve_speed_std_mps'].map((c) => (
            <SpeedMetricLine key={c} metric={getMetricByCode(f, c, player)} />
          ))}
        </div>
      </section>
    </div>
  );
}
