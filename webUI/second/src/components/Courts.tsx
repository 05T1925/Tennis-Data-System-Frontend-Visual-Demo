import { useMemo, useState } from 'react';
import { getLandingPointsByPlayer, getServeLandingPoints, type PlayerSlot } from '@tennis-ui/core';
import { fixture } from './EditorialBits';
export function Court({ player }: { player: PlayerSlot }) {
  const [filter, setFilter] = useState('all');
  const points = useMemo(
    () =>
      getLandingPointsByPlayer(fixture, player).filter((p) =>
        filter === 'all' || filter === 'error'
          ? filter === 'all' || p.isError
          : filter === 'winner'
            ? p.result === 'winner'
            : p.strokeType === filter,
      ),
    [player, filter],
  );
  return (
    <section className="courtBlock">
      <div className="filter" aria-label="击球落点筛选">
        {[
          ['all', '全部'],
          ['forehand', '正手'],
          ['backhand', '反手'],
          ['winner', '制胜分'],
          ['error', '失误'],
        ].map(([k, l]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k!)}>
            {l}
          </button>
        ))}
      </div>
      <svg
        className="court"
        viewBox="0 0 100 160"
        role="img"
        aria-label={`Player ${player} 击球落点`}
      >
        <title>Player {player} 击球落点</title>
        <rect x="4" y="4" width="92" height="152" />
        <path d="M4 80h92M50 4v152M4 43h92M4 117h92" />
        {points.map((p) => (
          <g key={p.shotId} data-position-source={p.positionSource}>
            {p.isError ? (
              <path className="mark error" d={`M${p.x * 100 - 2} ${p.y * 160 - 2}l4 4m0-4l-4 4`} />
            ) : p.result === 'winner' ? (
              <circle className="mark" cx={p.x * 100} cy={p.y * 160} r="2.6" />
            ) : (
              <rect
                className={p.strokeType === 'forehand' ? 'mark' : 'mark hollow'}
                x={p.x * 100 - 2}
                y={p.y * 160 - 2}
                width="4"
                height="4"
              />
            )}
            {p.positionSource === 'end' ? (
              <path className="endpointMark" d={`M${p.x * 100 - 4} ${p.y * 160 + 4}h8`} />
            ) : null}
          </g>
        ))}
      </svg>
      <p>{points.length} 个位置；叉号为失误，下方短划表示缺少 bouncePoint、采用 endPoint 示意。</p>
    </section>
  );
}
export function ServeCourt({ player }: { player: PlayerSlot }) {
  const [filter, setFilter] = useState('all');
  const points = useMemo(
    () =>
      getServeLandingPoints(fixture, player).filter(
        (p) => filter === 'all' || p.serveNumber === filter || p.courtSide === filter,
      ),
    [player, filter],
  );
  return (
    <section className="courtBlock">
      <div className="filter" aria-label="发球落点筛选">
        {[
          ['all', '全部'],
          ['first', '一发'],
          ['second', '二发'],
          ['deuce', 'Deuce'],
          ['ad', 'Ad'],
        ].map(([k, l]) => (
          <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k!)}>
            {l}
          </button>
        ))}
      </div>
      <svg
        className="serveCourt"
        viewBox="0 0 100 120"
        role="img"
        aria-label={`Player ${player} 发球落点`}
      >
        <title>Player {player} 发球落点</title>
        <rect x="4" y="4" width="92" height="112" />
        <path d="M4 60h92M50 4v56M18 32h64" />
        {points.map((p) => (
          <g key={p.shotId} data-position-source={p.positionSource}>
            {p.outcome === 'fault' ? (
              <path className="mark error" d={`M${p.x * 100 - 2} ${p.y * 120 - 2}l4 4m0-4l-4 4`} />
            ) : p.outcome === 'service_winner' ? (
              <path className="mark" d={`M${p.x * 100} ${p.y * 120 - 3}l3 3-3 3-3-3z`} />
            ) : (
              <circle
                className={p.serveNumber === 'first' ? 'mark' : 'mark hollow'}
                cx={p.x * 100}
                cy={p.y * 120}
                r={p.outcome === 'ace' ? 3.2 : 2}
              />
            )}
            {p.positionSource === 'end' ? (
              <path className="endpointMark" d={`M${p.x * 100 - 4} ${p.y * 120 + 4}h8`} />
            ) : null}
          </g>
        ))}
      </svg>
      <p>
        实心一发，空心二发，叉号 fault，下方短划为 endPoint 示意；
        {points.filter((p) => p.positionSource === 'end').length} 个降级位置。
      </p>
    </section>
  );
}
