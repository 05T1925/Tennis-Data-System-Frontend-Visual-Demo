import { useMemo, useState } from 'react';
import { getLandingPointsByPlayer, getServeLandingPoints, type PlayerSlot } from '@tennis-ui/core';
import { fixture } from './LabBits';

const markerPosition = (shotId: string, x: number, y: number, scale: number) => {
  const index = Number(shotId.match(/(\d+)$/)?.[1] ?? 0);
  const offset = ((index % 3) - 1) * 0.65;
  return { x: x * 100 + offset, y: y * scale + ((index % 2) * 0.45 - 0.2) };
};

export function DarkCourt({ player }: { player: PlayerSlot }) {
  const [filter, setFilter] = useState('all');
  const points = useMemo(
    () =>
      getLandingPointsByPlayer(fixture, player).filter(
        (point) =>
          filter === 'all' ||
          (filter === 'error'
            ? point.isError
            : filter === 'winner'
              ? point.result === 'winner'
              : point.strokeType === filter),
      ),
    [player, filter],
  );
  const downgrade = points.filter((point) => point.positionSource === 'end').length;
  return (
    <section className="dark-court-block">
      <div className="lab-filter" aria-label="击球落点筛选">
        {[
          ['all', '全部'],
          ['forehand', '正手'],
          ['backhand', '反手'],
          ['winner', '制胜分'],
          ['error', '失误'],
        ].map(([key, label]) => (
          <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key ?? 'all')}>
            {label}
          </button>
        ))}
      </div>
      <svg
        className="dark-court"
        viewBox="0 0 100 160"
        role="img"
        aria-label={`Player ${player} 击球落点`}
      >
        <title>Player {player} 击球落点</title>
        <rect x="4" y="4" width="92" height="152" />
        <path d="M4 80h92M50 4v152M4 43h92M4 117h92" />
        {points.map((point) => {
          const position = markerPosition(point.shotId, point.x, point.y, 160);
          return (
            <g
              key={point.shotId}
              data-position-source={point.positionSource}
              data-marker-offset="deterministic"
            >
              {point.isError ? (
                <path
                  className="mark error"
                  d={`M${position.x - 2.1} ${position.y - 2.1}l4.2 4.2m0-4.2l-4.2 4.2`}
                />
              ) : point.result === 'winner' ? (
                <circle className="mark winner" cx={position.x} cy={position.y} r="2.35" />
              ) : (
                <rect
                  className={point.strokeType === 'forehand' ? 'mark' : 'mark hollow'}
                  x={position.x - 1.7}
                  y={position.y - 1.7}
                  width="3.4"
                  height="3.4"
                />
              )}
              {point.positionSource === 'end' ? (
                <path
                  className="endpoint-mark"
                  d={`M${position.x - 2.8} ${position.y + 3.4}h5.6`}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <p>
        {points.length} POINTS / {points.filter((point) => point.isError).length} ERROR /{' '}
        {downgrade} ENDPOINT
      </p>
      <div className="legend">■ 正手 / □ 反手 / ● 制胜分 / × 失误 / — endPoint</div>
    </section>
  );
}

export function DarkServeCourt({ player }: { player: PlayerSlot }) {
  const [filter, setFilter] = useState('all');
  const points = useMemo(
    () =>
      getServeLandingPoints(fixture, player).filter(
        (point) => filter === 'all' || point.serveNumber === filter || point.courtSide === filter,
      ),
    [player, filter],
  );
  return (
    <section className="dark-court-block">
      <div className="lab-filter" aria-label="发球落点筛选">
        {[
          ['all', '全部'],
          ['first', '一发'],
          ['second', '二发'],
          ['deuce', '平分区 / Deuce'],
          ['ad', '占先区 / Ad'],
        ].map(([key, label]) => (
          <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key ?? 'all')}>
            {label}
          </button>
        ))}
      </div>
      <svg
        className="dark-serve-court"
        viewBox="0 0 100 120"
        role="img"
        aria-label={`Player ${player} 发球落点`}
      >
        <title>Player {player} 发球落点</title>
        <rect x="4" y="4" width="92" height="112" />
        <path d="M4 60h92M50 4v56M18 32h64" />
        {points.map((point) => {
          const position = markerPosition(point.shotId, point.x, point.y, 120);
          return (
            <g
              key={point.shotId}
              data-position-source={point.positionSource}
              data-marker-offset="deterministic"
            >
              {point.outcome === 'fault' ? (
                <path
                  className="mark error"
                  d={`M${position.x - 2.25} ${position.y - 2.25}l4.5 4.5m0-4.5l-4.5 4.5`}
                />
              ) : point.outcome === 'service_winner' ? (
                <path
                  className="mark service-winner"
                  d={`M${position.x} ${position.y - 2.6}l2.6 2.6-2.6 2.6-2.6-2.6z`}
                />
              ) : (
                <circle
                  className={point.serveNumber === 'first' ? 'mark' : 'mark hollow'}
                  cx={position.x}
                  cy={position.y}
                  r={point.outcome === 'ace' ? 2.9 : 1.75}
                />
              )}{' '}
              {point.positionSource === 'end' ? (
                <path
                  className="endpoint-mark"
                  d={`M${position.x - 2.8} ${position.y + 3.4}h5.6`}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <p>
        {points.length} SERVES / {points.filter((point) => point.outcome === 'fault').length} FAULT
        / {points.filter((point) => point.positionSource === 'end').length} ENDPOINT
      </p>
      <div className="legend">● 一发 / ○ 二发 / × fault / ◇ service winner / — endPoint</div>
    </section>
  );
}
