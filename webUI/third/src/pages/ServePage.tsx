import {
  demoMatchFixture,
  formatMetricValue,
  getMetricByCode,
  getServeDirectionSummary,
  parsePlayerSlotParam,
} from '@tennis-ui/core';
import { useSearchParams } from 'react-router-dom';
import { DarkServeCourt } from '../components/Courts';
import { MetricReadout, PlayerToggle } from '../components/LabBits';

const fixture = demoMatchFixture;
const serveCodes = (type: 'first' | 'second') => [
  `${type}_serve_attempt_count`,
  `${type}_serve_in_count`,
  `${type}_serve_in_rate`,
  `${type}_serve_point_win_rate`,
  `${type}_serve_avg_speed_mps`,
];
export function ServePage() {
  const [params] = useSearchParams();
  const player = parsePlayerSlotParam(params.get('player'));
  const directions = getServeDirectionSummary(fixture, player);
  return (
    <section className="lab-page">
      <header className="lab-page-head">
        <p>SERVE / PERFORMANCE LAB</p>
        <h1>发球分析</h1>
      </header>
      <PlayerToggle player={player} />
      <section className="serve-lab-layout">
        <article className="serve-telemetry">
          <p>FIRST SERVE</p>
          <div className="serve-primary-reading">
            <b>{formatMetricValue(getMetricByCode(fixture, 'first_serve_in_rate', player))}</b>
            <span>
              {formatMetricValue(getMetricByCode(fixture, 'first_serve_in_count', player))} /{' '}
              {formatMetricValue(getMetricByCode(fixture, 'first_serve_attempt_count', player))}
            </span>
          </div>
          {serveCodes('first').map((code) => (
            <MetricReadout
              key={code}
              metric={getMetricByCode(fixture, code, player)}
              speed={code.endsWith('_speed_mps')}
            />
          ))}
        </article>
        <DarkServeCourt player={player} />
        <article className="serve-telemetry">
          <p>SECOND SERVE</p>
          <div className="serve-primary-reading">
            <b>{formatMetricValue(getMetricByCode(fixture, 'second_serve_in_rate', player))}</b>
            <span>
              {formatMetricValue(getMetricByCode(fixture, 'second_serve_in_count', player))} /{' '}
              {formatMetricValue(getMetricByCode(fixture, 'second_serve_attempt_count', player))}
            </span>
          </div>
          {serveCodes('second').map((code) => (
            <MetricReadout
              key={code}
              metric={getMetricByCode(fixture, code, player)}
              speed={code.endsWith('_speed_mps')}
            />
          ))}
        </article>
      </section>
      <section className="serve-results">
        <h2>SERVE RESULT</h2>
        {['ace_rate', 'service_winner_rate', 'double_fault_rate'].map((code) => (
          <MetricReadout key={code} metric={getMetricByCode(fixture, code, player)} />
        ))}
      </section>
      <section className="serve-lower">
        <article>
          <h2>DIRECTION SCALE</h2>
          {directions.map((direction) => (
            <div key={direction.direction}>
              <span>
                {direction.direction.toUpperCase()} / {direction.count}
              </span>
              <i>
                <b style={{ width: `${(direction.rate ?? 0) * 100}%` }} />
              </i>
              <strong>
                {direction.rate === null ? '—' : `${(direction.rate * 100).toFixed(1)}%`}
              </strong>
              <small>{direction.sampleSize} 个样本</small>
            </div>
          ))}
        </article>
        <article>
          <h2>VELOCITY</h2>
          {['serve_avg_speed_mps', 'max_serve_speed_mps', 'serve_speed_std_mps'].map((code) => (
            <MetricReadout key={code} metric={getMetricByCode(fixture, code, player)} speed />
          ))}
        </article>
      </section>
    </section>
  );
}
