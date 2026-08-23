import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  demoMatchFixture,
  formatConfidence,
  formatDurationMs,
  formatMetricValue,
  formatSampleSize,
  formatSpeedKmh,
  formatSpeedMps,
  getEvidenceForMetric,
  getMetricByCode,
  getPlaybackContextAtTime,
  getRallyForPoint,
  mapAnalysisTimeToMediaTime,
  mapMediaTimeToAnalysisTime,
  parseAnalysisTimeParam,
} from '@tennis-ui/core';
import { useLocalVideoUrl } from '../hooks/useLocalVideoUrl';
import {
  clipTypeLabel,
  confidenceLabel,
  endReasonLabel,
  formatClock,
  resultLabel,
  strokeLabel,
} from '../features/video/presentation';
import styles from '../styles/app.module.css';

const fixture = demoMatchFixture;
const globalCodes = ['point_count', 'shot_count', 'avg_rally_shot_count', 'max_rally_shot_count'];
const playerCodes = [
  'point_win_rate',
  'winner_count',
  'max_serve_speed_mps',
  'max_shot_speed_mps',
  'forced_error_count',
  'unforced_error_count',
];

const playerName = (slot: 'A' | 'B') => fixture.players[slot].displayName;

function DataTierBadge({ tier }: { tier: 'P0' | 'P1' | 'P2' }) {
  return (
    <span className={`${styles.tierBadge} ${tier === 'P1' ? styles.tierP1 : ''}`}>{tier}</span>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

export function VideoDetailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const snapshot = searchParams.get('snapshot') === '1';
  const urlTime = parseAnalysisTimeParam(searchParams.get('time'), fixture.video.durationMs);
  const [analysisTimeMs, setAnalysisTimeMs] = useState(urlTime);
  const [mediaDurationSeconds, setMediaDurationSeconds] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<
    'idle' | 'loading' | 'ready' | 'error' | 'ended'
  >('idle');
  const videoRef = useRef<HTMLVideoElement>(null);
  const { videoUrl, fileName, error: fileError, selectFile } = useLocalVideoUrl();

  useEffect(() => {
    const syncId = window.setTimeout(() => setAnalysisTimeMs(urlTime), 0);
    return () => window.clearTimeout(syncId);
  }, [urlTime]);

  const context = useMemo(
    () => getPlaybackContextAtTime(fixture, analysisTimeMs),
    [analysisTimeMs],
  );

  const chooseTime = useCallback(
    (nextTimeMs: number, writeUrl = true) => {
      if (snapshot) return;
      const next = Math.max(0, Math.min(fixture.video.durationMs, Math.round(nextTimeMs)));
      setAnalysisTimeMs(next);
      if (writeUrl) {
        const params = new URLSearchParams(searchParams);
        params.set('time', String(next));
        setSearchParams(params, { replace: true });
      }
      const duration = mediaDurationSeconds;
      const mediaTime =
        duration === null
          ? null
          : mapAnalysisTimeToMediaTime(next, fixture.video.durationMs, duration);
      if (videoRef.current && mediaTime !== null) videoRef.current.currentTime = mediaTime;
    },
    [mediaDurationSeconds, searchParams, setSearchParams, snapshot],
  );

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file?.type.startsWith('video/') && file.size > 0) {
      setMediaDurationSeconds(null);
      setPlaybackState('loading');
    }
    selectFile(file);
    event.target.value = '';
  };
  const onTimeUpdate = () => {
    if (snapshot || !videoRef.current || mediaDurationSeconds === null) return;
    const next = mapMediaTimeToAnalysisTime(
      videoRef.current.currentTime,
      mediaDurationSeconds,
      fixture.video.durationMs,
    );
    if (next !== null) setAnalysisTimeMs(next);
  };
  const onLoadedMetadata = () => {
    const duration = videoRef.current?.duration;
    if (!duration || !Number.isFinite(duration) || duration <= 0) return;
    setMediaDurationSeconds(duration);
    setPlaybackState('ready');
    const mediaTime = mapAnalysisTimeToMediaTime(
      analysisTimeMs,
      fixture.video.durationMs,
      duration,
    );
    if (mediaTime !== null && videoRef.current) videoRef.current.currentTime = mediaTime;
  };
  const currentPointIndex = context.point
    ? fixture.points.findIndex((point) => point.id === context.point?.id)
    : -1;
  const previousTarget = context.point
    ? (fixture.points[currentPointIndex - 1] ?? null)
    : context.previousPoint;
  const nextTarget = context.point
    ? (fixture.points[currentPointIndex + 1] ?? null)
    : context.nextPoint;
  const currentClip = fixture.clips.find(
    (clip) => analysisTimeMs >= clip.startMs && analysisTimeMs < clip.endMs,
  );

  return (
    <div className={styles.workbench} data-snapshot={snapshot ? 'true' : 'false'}>
      <header className={styles.videoHeader}>
        <div>
          <p className={styles.kicker}>视频详情 / 分析工作台</p>
          <h2>{fixture.video.title}</h2>
          <p className={styles.metaLine}>
            {fixture.video.originalFileName} <span>•</span> Player A vs Player B <span>•</span> 单打{' '}
            <span>•</span> 硬地
          </p>
        </div>
        <div className={styles.headerStatus}>
          <span className={styles.statusComplete}>分析完成</span>
          <span>Mock 数据</span>
          <span>{fixture.video.algorithmVersion}</span>
          <span>{formatDurationMs(fixture.video.durationMs)}</span>
        </div>
      </header>

      <section className={styles.playbackGrid} aria-label="视频与实时分析">
        <section className={styles.videoPanel} aria-label="视频播放器">
          <div className={styles.videoFrame}>
            {videoUrl ? (
              <video
                ref={videoRef}
                className={styles.video}
                controls
                playsInline
                src={videoUrl}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setPlaybackState('ready')}
                onEnded={() => setPlaybackState('ended')}
                onError={() => setPlaybackState('error')}
              />
            ) : (
              <div className={styles.emptyVideo}>
                <div className={styles.courtLines} aria-hidden="true" />
                <div className={styles.emptyVideoCopy}>
                  <span className={styles.emptyLabel}>演示视频</span>
                  <strong>未加载演示视频</strong>
                  <p>选择本地 MP4 后，可验证播放、时间轴定位与当前分联动。</p>
                </div>
              </div>
            )}
          </div>
          <div className={styles.videoToolbar}>
            <label className={styles.fileButton}>
              <input
                aria-label="选择本地视频"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={onFileChange}
              />
              选择本地视频
            </label>
            <span>{fileName ?? '仅在浏览器本地使用，不会上传'}</span>
            <span className={styles.analysisClock}>分析时间 {formatClock(analysisTimeMs)}</span>
          </div>
          <p className={styles.videoMessage} role="status">
            {fileError ??
              (playbackState === 'error'
                ? '视频无法加载，请重新选择可播放文件。'
                : playbackState === 'loading'
                  ? '正在读取本地视频。'
                  : '')}
          </p>
        </section>

        <aside className={styles.livePanel} aria-label="当前比赛状态">
          <div className={styles.panelHeading}>
            <span>片段累计比分</span>
            <small>{snapshot ? 'Snapshot' : '实时选择'}</small>
          </div>
          <div className={styles.scoreBoard}>
            <div>
              <span>Player A</span>
              <strong>{context.score.split('-')[0]}</strong>
            </div>
            <span className={styles.scoreDivider}>:</span>
            <div className={styles.playerBScore}>
              <span>Player B</span>
              <strong>{context.score.split('-')[1]}</strong>
            </div>
          </div>
          <div className={styles.currentState}>
            <p>
              {context.phase === 'point'
                ? `当前 Point ${context.point?.pointIndex}`
                : context.phase === 'gap'
                  ? '分间间歇'
                  : context.phase === 'ended'
                    ? '比赛片段结束'
                    : '等待第一分'}
            </p>
            <span>
              {context.point
                ? `${playerName(context.point.serverSlot)} 发球 · ${context.point.scoreBefore} → ${context.point.scoreAfter}`
                : '当前拍：—'}
            </span>
          </div>
          <div className={styles.navControls}>
            <button
              type="button"
              onClick={() => previousTarget && chooseTime(previousTarget.startTimeMs)}
              disabled={!previousTarget || snapshot}
            >
              上一分
            </button>
            <button
              type="button"
              onClick={() => nextTarget && chooseTime(nextTarget.startTimeMs)}
              disabled={!nextTarget || snapshot}
            >
              下一分
            </button>
          </div>
          <section className={styles.contextBlock}>
            <div className={styles.blockTitle}>
              当前分 <DataTierBadge tier="P0" />
            </div>
            {context.point && context.rally ? (
              <>
                <DetailRow label="Point">
                  #{context.point.pointIndex} <em>{context.point.id}</em>
                </DetailRow>
                <DetailRow label="发球 / 接发">
                  {playerName(context.point.serverSlot)} / {playerName(context.point.receiverSlot)}
                </DetailRow>
                <DetailRow label="得分方">
                  {playerName(context.point.winnerSlot)} · {endReasonLabel[context.point.endReason]}
                </DetailRow>
                <DetailRow label="时长 / 回合">
                  {formatDurationMs(context.point.endTimeMs - context.point.startTimeMs)} /{' '}
                  {context.rally.shotCount} 拍
                </DetailRow>
                <DetailRow label="时间范围">
                  {formatClock(context.point.startTimeMs)}.
                  {String(context.point.startTimeMs % 1000).padStart(3, '0')}–
                  {formatClock(context.point.endTimeMs)}.
                  {String(context.point.endTimeMs % 1000).padStart(3, '0')}
                </DetailRow>
                <DetailRow label="关键分">{context.point.isKeyPoint ? '是' : '否'}</DetailRow>
              </>
            ) : (
              <p className={styles.emptyDetail}>暂无当前分</p>
            )}
          </section>
          <section className={styles.contextBlock}>
            <div className={styles.blockTitle}>
              当前拍 <DataTierBadge tier="P0" />
            </div>
            {context.shot ? (
              <>
                <DetailRow label="Shot">
                  #{context.shot.shotIndex} · {playerName(context.shot.playerSlot)}
                </DetailRow>
                <DetailRow label="类型 / 结果">
                  {strokeLabel[context.shot.strokeType]} / {resultLabel[context.shot.result]}
                </DetailRow>
                {context.shot.serve ? (
                  <DetailRow label="发球信息">
                    {context.shot.serve.serveNumber === 'first' ? '一发' : '二发'} ·{' '}
                    {context.shot.serve.direction === 'wide'
                      ? '外角'
                      : context.shot.serve.direction === 'body'
                        ? '追身'
                        : context.shot.serve.direction === 't'
                          ? '内角'
                          : '未识别'}{' '}
                    · {context.shot.serve.courtSide === 'deuce' ? 'Deuce' : 'Ad'}
                  </DetailRow>
                ) : null}
                <DetailRow label="球速">
                  {formatSpeedKmh(context.shot.speedMps)}{' '}
                  <em>{formatSpeedMps(context.shot.speedMps)}</em>
                </DetailRow>
                <DetailRow label="置信度">
                  {formatConfidence(context.shot.confidence)} ·{' '}
                  {confidenceLabel(context.shot.confidence)}
                </DetailRow>
                <DetailRow label="时间范围">
                  {formatClock(context.shot.startTimeMs)}.
                  {String(context.shot.startTimeMs % 1000).padStart(3, '0')}–
                  {formatClock(context.shot.endTimeMs)}.
                  {String(context.shot.endTimeMs % 1000).padStart(3, '0')}
                </DetailRow>
                <DetailRow label="误差归类">
                  {context.shot.errorClassification === 'forced'
                    ? '受迫'
                    : context.shot.errorClassification === 'unforced'
                      ? '非受迫'
                      : '—'}
                </DetailRow>
              </>
            ) : (
              <p className={styles.emptyDetail}>暂无当前拍</p>
            )}
          </section>
        </aside>
      </section>

      <section className={styles.timelineSection} aria-label="Point 和 Rally 时间轴">
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>POINT / RALLY</p>
            <h3>片段时间轴</h3>
          </div>
          <span>12 个 Point · 点击定位</span>
        </div>
        <div className={styles.timelineScroller}>
          <div className={styles.timelineTrack}>
            {fixture.points.map((point) => {
              const rally = getRallyForPoint(fixture, point)!;
              const active = context.point?.id === point.id;
              return (
                <button
                  type="button"
                  key={point.id}
                  className={`${styles.timelineNode} ${active ? styles.timelineActive : ''} ${point.winnerSlot === 'A' ? styles.pointA : styles.pointB}`}
                  onClick={() => chooseTime(point.startTimeMs)}
                  disabled={snapshot}
                  aria-pressed={active}
                  aria-label={`第 ${point.pointIndex} 分，${playerName(point.winnerSlot)} 得分，${endReasonLabel[point.endReason]}`}
                >
                  <span className={styles.pointMarker}>{point.winnerSlot}</span>
                  <strong>P{point.pointIndex}</strong>
                  <small>
                    {rally.shotCount} 拍 · {formatClock(point.startTimeMs)}
                  </small>
                  <em>
                    {endReasonLabel[point.endReason]}
                    {point.isKeyPoint ? ' · 关键' : ''}
                  </em>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.lowerGrid}>
        <section className={styles.metricSummary} aria-labelledby="metric-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>CORE METRICS</p>
              <h3 id="metric-heading">核心数据摘要</h3>
            </div>
            <span>共享 Fixture · 真实样本量</span>
          </div>
          <div className={styles.globalMetrics}>
            {globalCodes.map((code) => {
              const metric = getMetricByCode(fixture, code, 'ALL');
              return (
                <article key={code} className={styles.globalMetric}>
                  <span>{metric?.metricName ?? '—'}</span>
                  <strong>{formatMetricValue(metric)}</strong>
                  <small>
                    {formatSampleSize(metric?.sampleSize)} ·{' '}
                    <DataTierBadge tier={metric?.dataTier ?? 'P0'} />
                  </small>
                </article>
              );
            })}
          </div>
          <div className={styles.playerMetricTable}>
            {playerCodes.map((code) => (
              <div className={styles.metricRow} key={code}>
                <span className={styles.metricName}>
                  {getMetricByCode(fixture, code, 'A')?.metricName ?? code}
                </span>
                {(['A', 'B'] as const).map((slot) => {
                  const metric = getMetricByCode(fixture, code, slot);
                  const evidence = metric ? getEvidenceForMetric(fixture, metric)[0] : null;
                  return (
                    <div key={slot} className={styles.metricCell}>
                      <span>{playerName(slot)}</span>
                      <strong>{formatMetricValue(metric)}</strong>
                      <small>
                        {formatSampleSize(metric?.sampleSize)}{' '}
                        <DataTierBadge tier={metric?.dataTier ?? 'P0'} />{' '}
                        {metric?.dataTier === 'P1' ? formatConfidence(metric.confidence) : ''}
                      </small>
                      {evidence ? (
                        <button
                          type="button"
                          onClick={() => chooseTime(evidence.clipStartMs)}
                          disabled={snapshot}
                        >
                          {metric?.metricValue === 0 && evidence.label.includes('样本')
                            ? '查看样本'
                            : '查看证据'}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className={styles.disclosure}>
            <DataTierBadge tier="P1" /> 基于演示规则生成，不代表真实 CV 结论。
          </p>
        </section>

        <aside className={styles.clipList} aria-labelledby="clip-heading">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>KEY CLIPS</p>
              <h3 id="clip-heading">关键片段</h3>
            </div>
            <span>{currentClip ? '当前片段' : '可定位'}</span>
          </div>
          {fixture.clips.map((clip) => {
            const rally = clip.rallyId
              ? fixture.rallies.find((entry) => entry.id === clip.rallyId)
              : null;
            const active = currentClip?.clipId === clip.clipId;
            return (
              <button
                type="button"
                key={clip.clipId}
                className={`${styles.clipItem} ${active ? styles.clipActive : ''}`}
                onClick={() => chooseTime(clip.startMs)}
                disabled={snapshot}
                aria-pressed={active}
              >
                <span className={styles.clipType}>{clipTypeLabel[clip.type]}</span>
                <strong>{clip.title}</strong>
                <small>
                  {clip.playerSlot ? playerName(clip.playerSlot) : '整场'} ·{' '}
                  {formatClock(clip.startMs)} · {formatDurationMs(clip.endMs - clip.startMs)}
                </small>
                <em>
                  {clip.pointId} · {rally?.shotCount ?? '—'} 拍 · 定位此片段
                </em>
              </button>
            );
          })}
        </aside>
      </section>
    </div>
  );
}
