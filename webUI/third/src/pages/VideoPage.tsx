import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatConfidence,
  formatDurationMs,
  formatSpeedKmh,
  formatSpeedMps,
  getMetricByCode,
  getPlaybackContextAtTime,
  mapAnalysisTimeToMediaTime,
  mapMediaTimeToAnalysisTime,
  parseAnalysisTimeParam,
} from '@tennis-ui/core';
import { MetricReadout } from '../components/LabBits';
import { useLocalVideoUrl } from '../hooks/useLocalVideoUrl';

const fixture = demoMatchFixture;
const reason = {
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
const stroke = {
  serve: '发球',
  forehand: '正手',
  backhand: '反手',
  volley: '截击',
  unknown: '未知',
};

export function VideoPage() {
  const [params, setParams] = useSearchParams();
  const snapshot = params.get('snapshot') === '1';
  const urlTime = parseAnalysisTimeParam(params.get('time'), fixture.video.durationMs);
  const [time, setTime] = useState(urlTime);
  const [duration, setDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const { url, selectFile } = useLocalVideoUrl();
  useEffect(() => {
    queueMicrotask(() => setTime(urlTime));
  }, [urlTime, snapshot]);
  const context = useMemo(() => getPlaybackContextAtTime(fixture, time), [time]);
  const choose = (nextTime: number) => {
    if (snapshot) return;
    const next = Math.max(0, Math.min(fixture.video.durationMs, nextTime));
    setTime(next);
    const query = new URLSearchParams(params);
    query.set('time', String(next));
    setParams(query);
    if (duration && ref.current)
      ref.current.currentTime =
        mapAnalysisTimeToMediaTime(next, fixture.video.durationMs, duration) ?? 0;
  };
  const shot = context.shot;
  return (
    <section className="lab-page video-terminal">
      <header className="lab-page-head">
        <p>VIDEO / ANALYSIS TERMINAL</p>
        <h1>视频分析终端</h1>
      </header>
      <section className="video-stage" aria-label="视频分析舞台">
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
                const next = mapMediaTimeToAnalysisTime(
                  ref.current.currentTime,
                  duration,
                  fixture.video.durationMs,
                );
                if (next !== null) setTime(next);
              }
            }}
          />
        ) : (
          <div className="court-placeholder">
            <svg viewBox="0 0 160 90" role="img" aria-label="深色网球场占位">
              <title>深色网球场占位</title>
              <rect x="4" y="4" width="152" height="82" />
              <path d="M4 45h152M80 4v82M4 25h152M4 65h152" />
            </svg>
            <p>VIDEO SOURCE / LOCAL</p>
            <h2>未加载演示视频</h2>
            <span>选择本地视频后验证时间联动</span>
            <div className="empty-stage-data" aria-label="空状态分析预览">
              <span>FIXTURE 02:00</span>
              <span>12 POINTS</span>
              <span>69 SHOTS</span>
              <span>ANALYSIS {formatDurationMs(time)}</span>
            </div>
          </div>
        )}
      </section>
      <div className="stage-tools">
        <label>
          选择本地视频
          <input
            aria-label="选择本地视频"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setDuration(null);
                setVideoError(null);
                selectFile(file);
              }
            }}
          />
        </label>
        <span>MP4 / WEBM / QUICKTIME</span>
        {videoError ? <b aria-live="polite">{videoError}</b> : null}
      </div>
      <section className="telemetry-strip" aria-label="实时遥测">
        <div>
          <span>SCORE</span>
          <b>{context.score}</b>
        </div>
        <div>
          <span>CURRENT POINT</span>
          <b>{context.point ? `P${context.point.pointIndex}` : context.phase.toUpperCase()}</b>
        </div>
        <div>
          <span>CURRENT SHOT</span>
          <b>{shot ? `S${shot.shotIndex}` : '—'}</b>
        </div>
        <div>
          <span>VELOCITY</span>
          <b>{formatSpeedKmh(shot?.speedMps)}</b>
        </div>
        <div>
          <span>RALLY / TIME</span>
          <b>
            {context.rally?.shotCount ?? 0} / {formatDurationMs(time)}
          </b>
        </div>
        <div>
          <span>DATA TIER</span>
          <b>P0 / P1</b>
        </div>
      </section>
      <section className="lab-timeline" aria-label="Point 时间轴">
        {fixture.points.map((point) => (
          <button
            key={point.id}
            disabled={snapshot}
            aria-pressed={context.point?.id === point.id}
            onClick={() => choose(point.startTimeMs)}
          >
            <small>P{point.pointIndex}</small>
            <i>{point.winnerSlot}</i>
            <span>{formatDurationMs(point.startTimeMs)}</span>
          </button>
        ))}
      </section>
      <div className="point-nav">
        <button
          disabled={snapshot || !context.previousPoint}
          onClick={() => context.previousPoint && choose(context.previousPoint.startTimeMs)}
        >
          上一分
        </button>
        <button
          disabled={snapshot || !context.nextPoint}
          onClick={() => context.nextPoint && choose(context.nextPoint.startTimeMs)}
        >
          下一分
        </button>
      </div>
      <section className="telemetry-grid">
        <article>
          <p>POINT TELEMETRY</p>
          <h2>
            {context.point
              ? `P${context.point.pointIndex} / ${context.phase.toUpperCase()}`
              : context.phase === 'ended'
                ? '片段结束'
                : '分间间歇'}
          </h2>
          {context.point ? (
            <dl>
              <div>
                <dt>发球 / 接发</dt>
                <dd>
                  Player {context.point.serverSlot} / Player {context.point.receiverSlot}
                </dd>
              </div>
              <div>
                <dt>得分方 / 结束</dt>
                <dd>
                  Player {context.point.winnerSlot} / {reason[context.point.endReason]}
                </dd>
              </div>
              <div>
                <dt>回合 / 关键分</dt>
                <dd>
                  {context.rally?.shotCount ?? 0} 拍 / {context.point.isKeyPoint ? '是' : '否'}
                </dd>
              </div>
              <div>
                <dt>时间区间</dt>
                <dd>
                  {formatDurationMs(context.point.startTimeMs)} -{' '}
                  {formatDurationMs(context.point.endTimeMs)}
                </dd>
              </div>
            </dl>
          ) : (
            <p>上一分比分 {context.score}；等待下一有效 Point。</p>
          )}
        </article>
        <article>
          <p>SHOT TELEMETRY</p>
          <h2>{shot ? `S${shot.shotIndex} / ${stroke[shot.strokeType]}` : '暂无当前拍'}</h2>
          {shot ? (
            <dl>
              <div>
                <dt>球员 / 球速</dt>
                <dd>
                  Player {shot.playerSlot} / {formatSpeedKmh(shot.speedMps)}{' '}
                  <small>{formatSpeedMps(shot.speedMps)}</small>
                </dd>
              </div>
              <div>
                <dt>置信度</dt>
                <dd>{formatConfidence(shot.confidence)}</dd>
              </div>
              <div>
                <dt>发球信息</dt>
                <dd>
                  {shot.serve
                    ? `${shot.serve.serveNumber === 'first' ? '一发' : '二发'} / ${shot.serve.direction} / ${shot.serve.courtSide}`
                    : '非发球击球'}
                </dd>
              </div>
              <div>
                <dt>失误分类 / 时间</dt>
                <dd>
                  {shot.errorClassification ?? '无'} / {formatDurationMs(shot.startTimeMs)} -{' '}
                  {formatDurationMs(shot.endTimeMs)}
                </dd>
              </div>
            </dl>
          ) : (
            <p>当前分析时间没有有效击球。</p>
          )}
        </article>
      </section>
      <section className="performance-matrix">
        <h2>CORE PERFORMANCE MATRIX</h2>
        {['point_count', 'shot_count', 'avg_rally_shot_count', 'max_rally_shot_count'].map(
          (code) => (
            <MetricReadout key={code} metric={getMetricByCode(fixture, code, 'ALL')} />
          ),
        )}
      </section>
      <section className="evidence-index">
        <h2>CLIP INDEX</h2>
        {fixture.clips.map((clip, index) => (
          <a key={clip.clipId} href={`/video/${fixture.video.uploadId}?time=${clip.startMs}`}>
            <b>C{String(index + 1).padStart(2, '0')}</b>
            <span>{clip.title}</span>
            <time>{formatDurationMs(clip.startMs)}</time>
          </a>
        ))}
      </section>
    </section>
  );
}
