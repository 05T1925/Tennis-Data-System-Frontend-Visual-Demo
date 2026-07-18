import { describe, expect, it, vi } from 'vitest';

import { adaptResultDto, adaptVideoDto } from './adapters/domainAdapters';
import { resultDtoSchema, taskDtoSchema, videoDtoSchema } from './dto/schemas';
import { createHttpClient } from './http/createHttpClient';
import { AccessTokenStore } from './token/AccessTokenStore';
import { RealAnalysisService } from '../features/analysis/services/RealAnalysisService';
import { completeMobileLocalSignOut } from '../features/auth/services/AuthService';
import { RealAuthService } from '../features/auth/services/RealAuthService';
import { RealVideoService } from '../features/videos/services/RealVideoService';

const userDto = {
  id: 'user-1',
  email: 'user@example.com',
  display_name: 'User',
  role: 'user' as const,
  created_at: '2026-07-18T12:00:00.000Z',
};
const videoDto = {
  id: 'video-1',
  user_id: 'user-1',
  title: 'Training',
  original_file_name: 'training.mp4',
  mime_type: 'video/mp4',
  file_size_bytes: 1024,
  match_type: 'training' as const,
  play_mode: 'singles' as const,
  upload_status: 'uploaded' as const,
  upload_progress: 100,
  created_at: '2026-07-18T12:00:00.000Z',
  updated_at: '2026-07-18T12:00:00.000Z',
};
const taskDto = {
  id: 'task-1',
  video_id: 'video-1',
  status: 'succeeded' as const,
  stage: 'completed' as const,
  progress: 100,
  retry_count: 0,
  created_at: '2026-07-18T12:00:00.000Z',
  completed_at: '2026-07-18T12:01:00.000Z',
  updated_at: '2026-07-18T12:01:00.000Z',
};
const resultDto = {
  id: 'result-1',
  video_id: 'video-1',
  data_version: 'draft-v1',
  summary: {
    duration_seconds: 60,
    total_shots: 0,
    total_rallies: 0,
    average_shots_per_rally: 0,
    longest_rally_shots: 0,
  },
  shots: [],
  rallies: [],
  points: [],
  heatmap_points: [],
  created_at: '2026-07-18T12:01:00.000Z',
};
const linkedResultDto = {
  ...resultDto,
  summary: { ...resultDto.summary, total_shots: 2, total_rallies: 2, total_points: 2 },
  shots: [
    {
      id: 'shot-1',
      video_id: 'video-1',
      rally_id: 'rally-a',
      shot_index: 0,
      started_at_ms: 0,
      ended_at_ms: 100,
      start_point: { x: 0, y: 0 },
      end_point: { x: 1, y: 1 },
    },
    {
      id: 'shot-2',
      video_id: 'video-1',
      rally_id: 'rally-b',
      shot_index: 1,
      started_at_ms: 100,
      ended_at_ms: 200,
      start_point: { x: 1, y: 1 },
      end_point: { x: 2, y: 2 },
    },
  ],
  rallies: [
    {
      id: 'rally-a',
      video_id: 'video-1',
      point_id: 'point-a',
      rally_index: 0,
      started_at_ms: 0,
      ended_at_ms: 100,
      shot_ids: ['shot-1'],
      shot_count: 1,
    },
    {
      id: 'rally-b',
      video_id: 'video-1',
      point_id: 'point-b',
      rally_index: 1,
      started_at_ms: 100,
      ended_at_ms: 200,
      shot_ids: ['shot-2'],
      shot_count: 1,
    },
  ],
  points: [
    {
      id: 'point-a',
      video_id: 'video-1',
      rally_id: 'rally-a',
      point_index: 0,
      started_at_ms: 0,
      ended_at_ms: 100,
    },
    {
      id: 'point-b',
      video_id: 'video-1',
      rally_id: 'rally-b',
      point_index: 1,
      started_at_ms: 100,
      ended_at_ms: 200,
    },
  ],
};

function json(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

describe('Mobile Draft Real services', () => {
  it('uses Auth Draft DTOs and the in-memory token store', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: { access_token: 'stub-access-token', user: userDto } }));
    const tokens = new AccessTokenStore();
    const service = new RealAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    const session = await service.login({ email: ' USER@example.com ', password: 'password' });
    expect(session).toMatchObject({ mode: 'real', accessToken: 'stub-access-token' });
    expect(session.user).toMatchObject({ displayName: 'User', updatedAt: userDto.created_at });
    expect(tokens.getAccessToken()).toBe('stub-access-token');
    expect(fetchImpl).toHaveBeenCalledWith(
      new URL('https://api.example.com/api/v1/auth/login'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('restores through /auth/me and clears the token after logout', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: userDto }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const tokens = new AccessTokenStore();
    const service = new RealAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    const session = {
      version: 2 as const,
      mode: 'real' as const,
      accessToken: 'stub-access-token',
      user: {
        id: 'old',
        displayName: 'Old',
        role: 'user' as const,
        createdAt: userDto.created_at,
        updatedAt: userDto.created_at,
      },
    };
    await expect(service.restore(session)).resolves.toMatchObject({ user: { id: 'user-1' } });
    await service.logout(session);
    service.clearLocalCredentials();
    expect(tokens.getAccessToken()).toBeNull();
    expect(fetchImpl.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      '/api/v1/auth/me',
      '/api/v1/auth/logout',
    ]);
  });

  it('clears the local token even when remote logout fails', async () => {
    const tokens = new AccessTokenStore();
    tokens.setAccessToken('stub-access-token');
    const service = new RealAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 })),
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    await expect(service.logout(null)).rejects.toMatchObject({ code: 'REAL_API_SERVER_ERROR' });
    service.clearLocalCredentials();
    expect(tokens.getAccessToken()).toBeNull();
  });

  it('completes local Provider logout after a remote 500', async () => {
    const tokens = new AccessTokenStore();
    tokens.setAccessToken('stub-access-token');
    const service = new RealAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 })),
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    const removeStoredSession = vi.fn<() => Promise<void>>().mockResolvedValue();
    const outcome = await completeMobileLocalSignOut(service, null, removeStoredSession);
    expect(outcome).toMatchObject({ session: null, status: 'unauthenticated' });
    expect(outcome.error).toMatchObject({ code: 'REAL_API_SERVER_ERROR' });
    expect(tokens.getAccessToken()).toBeNull();
    expect(removeStoredSession).toHaveBeenCalledOnce();
  });

  it('supports Video and Analysis Level 2 and rejects unsupported methods', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({
          data: {
            items: [{ video: videoDto, analysis_task: taskDto }],
            page: 1,
            page_size: 3,
            total: 1,
            unfiltered_total: 1,
          },
        }),
      )
      .mockResolvedValueOnce(json({ data: { video: videoDto, analysis_task: taskDto } }))
      .mockResolvedValueOnce(json({ data: { task: taskDto } }))
      .mockResolvedValueOnce(json({ data: { task: taskDto } }))
      .mockResolvedValueOnce(json({ data: { result: resultDto } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl,
      accessTokenProvider: new AccessTokenStore(),
    });
    const videos = new RealVideoService(client);
    const analysis = new RealAnalysisService(client);
    await expect(videos.getRecentVideos({ userId: 'user-1', limit: 3 })).resolves.toHaveLength(1);
    await expect(
      videos.getVideoById({ userId: 'user-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ id: 'video-1' });
    await expect(
      analysis.startAnalysis({ userId: 'user-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ id: 'task-1' });
    await expect(
      analysis.getAnalysisTaskByVideoId({ userId: 'user-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ id: 'task-1' });
    await expect(
      analysis.getAnalysisResultByVideoId({ userId: 'user-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ id: 'result-1' });
    await expect(
      videos.deleteVideo({ userId: 'user-1', videoId: 'video-1' }),
    ).resolves.toBeUndefined();
    await expect(
      videos.createVideo({
        userId: 'user-1',
        input: {
          title: 'Training',
          originalFileName: 'training.mp4',
          mimeType: 'video/mp4',
          fileSizeBytes: 100,
          matchType: 'training',
          playMode: 'singles',
        },
      }),
    ).rejects.toMatchObject({ code: 'REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED' });
    await expect(
      videos.startUpload({ userId: 'user-1', videoId: 'video-1' }),
    ).rejects.toMatchObject({ code: 'REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED' });
    await expect(
      analysis.retryAnalysis({ userId: 'user-1', videoId: 'video-1' }),
    ).rejects.toMatchObject({ code: 'REAL_RETRY_CONTRACT_NOT_CONFIGURED' });
  });

  it('validates adapters without mutating DTOs and rejects invalid references', () => {
    const parsedVideo = videoDtoSchema.parse(videoDto);
    const before = JSON.stringify(parsedVideo);
    expect(adaptVideoDto(parsedVideo).originalFileName).toBe('training.mp4');
    expect(JSON.stringify(parsedVideo)).toBe(before);

    const invalid = resultDtoSchema.parse({
      ...resultDto,
      summary: { ...resultDto.summary, total_shots: 1 },
    });
    expect(() => adaptResultDto(invalid)).toThrow(
      expect.objectContaining({ code: 'REAL_API_RESPONSE_INVALID' }),
    );
    expect(videoDtoSchema.safeParse({ ...videoDto, file_size_bytes: -1 }).success).toBe(false);
    expect(videoDtoSchema.safeParse({ ...videoDto, created_at: 'not-iso' }).success).toBe(false);
    expect(videoDtoSchema.safeParse({ ...videoDto, upload_status: 'queued' }).success).toBe(false);
    expect(
      taskDtoSchema.safeParse({ ...taskDto, status: 'failed', stage: 'ball_tracking' }).success,
    ).toBe(false);
    expect(
      resultDtoSchema.safeParse({
        ...resultDto,
        summary: { ...resultDto.summary, duration_seconds: Number.NaN },
      }).success,
    ).toBe(false);

    const valid = resultDtoSchema.parse(linkedResultDto);
    const validBefore = JSON.stringify(valid);
    expect(adaptResultDto(valid).shots).toHaveLength(2);
    expect(JSON.stringify(valid)).toBe(validBefore);

    const invalidRallies = [
      [
        { ...linkedResultDto.rallies[0], shot_ids: ['shot-2'] },
        { ...linkedResultDto.rallies[1], shot_ids: ['shot-1'] },
      ],
      [{ ...linkedResultDto.rallies[0], shot_ids: [], shot_count: 0 }, linkedResultDto.rallies[1]],
      [
        linkedResultDto.rallies[0],
        { ...linkedResultDto.rallies[1], shot_ids: ['shot-1', 'shot-2'], shot_count: 2 },
      ],
      [
        { ...linkedResultDto.rallies[0], shot_ids: ['shot-1', 'shot-1'], shot_count: 2 },
        linkedResultDto.rallies[1],
      ],
    ];
    for (const rallies of invalidRallies) {
      const parsed = resultDtoSchema.parse({ ...linkedResultDto, rallies });
      expect(() => adaptResultDto(parsed)).toThrow(
        expect.objectContaining({ code: 'REAL_API_RESPONSE_INVALID' }),
      );
    }
  });
});
