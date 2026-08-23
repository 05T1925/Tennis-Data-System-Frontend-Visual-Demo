import { useEffect, useMemo, useRef, useState } from 'react';
import {
  demoMatchFixture,
  formatDurationMs,
  formatConfidence,
  formatMetricValue,
  formatSpeedKmh,
  getMetricByCode,
  getPlaybackContextAtTime,
  mapAnalysisTimeToMediaTime,
  mapMediaTimeToAnalysisTime,
  parseAnalysisTimeParam,
} from '@tennis-ui/core';
import { useSearchParams } from 'react-router-dom';
import { useLocalVideoUrl } from '../hooks/useLocalVideoUrl';
const f = demoMatchFixture;
const strokeNames = {
  serve: '发球',
  forehand: '正手',
  backhand: '反手',
  volley: '截击',
  unknown: '未知拍型',
};
const reasonNames = {
  ace: 'Ace',
  service_winner: '发球直接得分',
  winner: '制胜分',
  double_fault: '双误',
  forced_error: '受迫失误',
  unforced_error: '非受迫失误',
  net: '下网',
  long: '出底线',
  wide: '出边线',
  unknown: '未知',
};
const directionNames = { wide: '外角', body: '追身', t: 'T 点', unknown: '方向未知' };
const errorNames = { forced: '受迫失误', unforced: '非受迫失误', unknown: '失误待定' };
export function VideoPage() {
  const [q, setQ] = useSearchParams(),
    snapshot = q.get('snapshot') === '1',
    urlTime = parseAnalysisTimeParam(q.get('time'), f.video.durationMs),
    [time, setTime] = useState(urlTime),
    [duration, setDuration] = useState<number | null>(null),
    [videoError, setVideoError] = useState<string | null>(null),
    ref = useRef<HTMLVideoElement>(null);
  const { url, selectFile } = useLocalVideoUrl();
  useEffect(() => {
    queueMicrotask(() => setTime(urlTime));
  }, [urlTime, snapshot]);
  const context = useMemo(() => getPlaybackContextAtTime(f, time), [time]);
  const choose = (n: number) => {
    if (snapshot) return;
    const next = Math.max(0, Math.min(f.video.durationMs, n));
    setTime(next);
    const x = new URLSearchParams(q);
    x.set('time', String(next));
    setQ(x);
    if (duration && ref.current)
      ref.current.currentTime = mapAnalysisTimeToMediaTime(next, f.video.durationMs, duration) ?? 0;
  };
  const previousPoint = context.previousPoint;
  const nextPoint = context.nextPoint;
  return (
    <div className="page videoPage">
      <header className="pageHead compactHead">
        <p>MATCH VIDEO REPORT</p>
        <h1>视频详情</h1>
      </header>
      <section className="videoHero">
        {url ? (
          <video
            ref={ref}
            aria-label="本地比赛视频"
            src={url}
            controls
            onLoadedMetadata={() => setDuration(ref.current?.duration ?? null)}
            onError={() => setVideoError('无法加载该视频文件，请选择可播放的视频。')}
            onTimeUpdate={() => {
              if (!snapshot && ref.current && duration) {
                const n = mapMediaTimeToAnalysisTime(
                  ref.current.currentTime,
                  duration,
                  f.video.durationMs,
                );
                if (n !== null) setTime(n);
              }
            }}
          />
        ) : (
          <div className="emptyFilm">
            <div className="filmCourt" />
            <h2>未加载演示视频</h2>
            <p>选择本地视频后，可验证播放、时间轴定位与当前分联动。</p>
          </div>
        )}
      </section>
      <label className="filePick">
        选择本地视频
        <input
          aria-label="选择本地视频"
          type="file"
          accept="video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setDuration(null);
              setVideoError(null);
              selectFile(file);
            }
          }}
        />
      </label>
      {videoError ? (
        <p className="mediaError" aria-live="polite">
          {videoError}
        </p>
      ) : null}
      <section className="scoreStrip">
        <b>PLAYER A {context.score.split('-')[0]}</b>
        <span>片段累计比分 · MATCH FRAGMENT</span>
        <b>PLAYER B {context.score.split('-')[1]}</b>
      </section>
      <section className="editorialTimeline" aria-label="Point 时间轴">
        {f.points.map((p) => (
          <button
            key={p.id}
            disabled={snapshot}
            aria-pressed={context.point?.id === p.id}
            onClick={() => choose(p.startTimeMs)}
          >
            <i>{p.winnerSlot}</i>
            <b>P{p.pointIndex}</b>
          </button>
        ))}
      </section>
      <div className="pointControls" aria-label="Point 定位">
        <button
          disabled={snapshot || !previousPoint}
          onClick={() => previousPoint && choose(previousPoint.startTimeMs)}
        >
          上一分
        </button>
        <button
          disabled={snapshot || !nextPoint}
          onClick={() => nextPoint && choose(nextPoint.startTimeMs)}
        >
          下一分
        </button>
      </div>
      <section className="twoColumns story">
        <div>
          <p>当前 POINT</p>
          <h2>{context.point ? `P${context.point.pointIndex}` : '分间间歇'}</h2>
          {context.point ? (
            <dl className="contextFacts">
              <div>
                <dt>发球 / 接发</dt>
                <dd>
                  Player {context.point.serverSlot} / Player {context.point.receiverSlot}
                </dd>
              </div>
              <div>
                <dt>得分方</dt>
                <dd>Player {context.point.winnerSlot}</dd>
              </div>
              <div>
                <dt>回合拍数</dt>
                <dd>{context.rally?.shotCount ?? 0} 拍</dd>
              </div>
              <div>
                <dt>结束原因</dt>
                <dd>{reasonNames[context.point.endReason]}</dd>
              </div>
              <div>
                <dt>时间</dt>
                <dd>
                  {formatDurationMs(context.point.startTimeMs)} -{' '}
                  {formatDurationMs(context.point.endTimeMs)}
                </dd>
              </div>
              <div>
                <dt>关键分</dt>
                <dd>{context.point.isKeyPoint ? '是' : '否'}</dd>
              </div>
            </dl>
          ) : (
            <p>{context.phase === 'ended' ? '比赛片段已结束' : '等待下一分'}</p>
          )}
        </div>
        <div>
          <p>当前 SHOT</p>
          <h2>
            {context.shot
              ? `第 ${context.shot.shotIndex} 拍 · ${strokeNames[context.shot.strokeType]}`
              : '暂无当前拍'}
          </h2>
          {context.shot ? (
            <dl className="contextFacts">
              <div>
                <dt>球员 / 球速</dt>
                <dd>
                  Player {context.shot.playerSlot} · {formatSpeedKmh(context.shot.speedMps)}
                </dd>
              </div>
              <div>
                <dt>置信度</dt>
                <dd>{formatConfidence(context.shot.confidence)}</dd>
              </div>
              <div>
                <dt>发球信息</dt>
                <dd>
                  {context.shot.serve
                    ? `${context.shot.serve.serveNumber === 'first' ? '一发' : '二发'} · ${directionNames[context.shot.serve.direction]}`
                    : '非发球击球'}
                </dd>
              </div>
              <div>
                <dt>失误分类</dt>
                <dd>
                  {context.shot.errorClassification
                    ? errorNames[context.shot.errorClassification]
                    : '无'}
                </dd>
              </div>
              <div>
                <dt>时间</dt>
                <dd>
                  {formatDurationMs(context.shot.startTimeMs)} -{' '}
                  {formatDurationMs(context.shot.endTimeMs)}
                </dd>
              </div>
            </dl>
          ) : (
            <p>等待有效击球</p>
          )}
        </div>
      </section>
      <section className="rallyColumns">
        <h2>核心数据</h2>
        {['point_count', 'shot_count', 'avg_rally_shot_count', 'max_rally_shot_count'].map((c) => {
          const m = getMetricByCode(f, c, 'ALL');
          return (
            <article key={c}>
              <b>{m?.metricName}</b>
              <strong>{formatMetricValue(m)}</strong>
            </article>
          );
        })}
      </section>
      <section className="clipIndex">
        <h2>关键片段</h2>
        {f.clips.map((c, i) => (
          <button key={c.clipId} disabled={snapshot} onClick={() => choose(c.startMs)}>
            <b>{String(i + 1).padStart(2, '0')}</b>
            {c.title}
            <span>{formatDurationMs(c.startMs)}</span> →
          </button>
        ))}
      </section>
    </div>
  );
}
