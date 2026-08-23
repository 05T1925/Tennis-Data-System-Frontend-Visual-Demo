import { describe, expect, it, vi } from 'vitest';

import { adaptResultDto, adaptVideoDto } from './adapters';
import { resultDtoSchema, taskDtoSchema, videoDtoSchema, videoListEnvelopeSchema } from './dto';
import { createHttpClient } from './http';
import { AccessTokenStore } from './token/AccessTokenStore';
import { RealWebAnalysisService } from '../features/analysis/realWebAnalysisService';
import { commitWebSessionLocally, completeWebLocalSignOut } from '../features/auth/WebAuthService';
import { RealWebAuthService } from '../features/auth/RealWebAuthService';
import { RealWebVideoService } from '../features/videos/realWebVideoService';

const userDto = {
  id: 'admin-1',
  email: 'admin@example.com',
  display_name: 'Admin',
  role: 'admin' as const,
  created_at: '2026-07-18T12:00:00.000Z',
};
const videoDto = {
  id: 'video-1',
  user_id: 'user-1',
  title: 'Training',
  original_file_name: 'training.mp4',
  mime_type: 'video/mp4',
  file_size_bytes: 100,
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
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

describe('Web Draft Real services', () => {
  it('authenticates only Stub admins and stores the token through injection', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(json({ data: { access_token: 'stub-access-token', user: userDto } }));
    const tokens = new AccessTokenStore();
    const auth = new RealWebAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    await expect(
      auth.login({ email: 'admin@example.com', password: 'password' }),
    ).resolves.toMatchObject({ mode: 'real', user: { role: 'admin' } });
    expect(tokens.getAccessToken()).toBe('stub-access-token');

    const nonAdminFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        json({ data: { access_token: 'stub-access-token', user: { ...userDto, role: 'user' } } }),
      );
    const nonAdmin = new RealWebAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl: nonAdminFetch,
        accessTokenProvider: new AccessTokenStore(),
      }),
      new AccessTokenStore(),
    );
    await expect(
      nonAdmin.login({ email: 'user@example.com', password: 'password' }),
    ).rejects.toMatchObject({ code: 'REAL_API_FORBIDDEN' });
  });

  it('restores the admin through /auth/me and clears the token on logout', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: userDto }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const tokens = new AccessTokenStore();
    const service = new RealWebAuthService(
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
        role: 'admin' as const,
        createdAt: userDto.created_at,
        updatedAt: userDto.created_at,
      },
    };
    await expect(service.restore(session)).resolves.toMatchObject({ user: { id: 'admin-1' } });
    await service.logout(session);
    service.clearLocalCredentials();
    expect(tokens.getAccessToken()).toBeNull();
  });

  it('clears the local token even when remote logout fails', async () => {
    const tokens = new AccessTokenStore();
    tokens.setAccessToken('stub-access-token');
    const service = new RealWebAuthService(
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
    const service = new RealWebAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 500 })),
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    const clearStoredSession = vi.fn<() => void>();
    const outcome = await completeWebLocalSignOut(service, null, clearStoredSession);
    expect(outcome).toMatchObject({ session: null, status: 'unauthenticated' });
    expect(outcome.error).toMatchObject({ code: 'REAL_API_SERVER_ERROR' });
    expect(tokens.getAccessToken()).toBeNull();
    expect(clearStoredSession).toHaveBeenCalledOnce();
  });

  it('clears the token when committing a login or restored session fails', async () => {
    const tokens = new AccessTokenStore();
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json({ data: { access_token: 'stub-token', user: userDto } }))
      .mockResolvedValueOnce(json({ data: userDto }));
    const service = new RealWebAuthService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: tokens,
      }),
      tokens,
    );
    const clearStoredSession = vi.fn<() => void>();
    const failSave = () => {
      throw new Error('sessionStorage unavailable');
    };
    const loginSession = await service.login({ email: 'admin@example.com', password: 'password' });
    expect(() =>
      commitWebSessionLocally(service, loginSession, failSave, clearStoredSession),
    ).toThrow('sessionStorage unavailable');
    expect(tokens.getAccessToken()).toBeNull();

    const restoredSession = await service.restore(loginSession);
    expect(() =>
      commitWebSessionLocally(service, restoredSession, failSave, clearStoredSession),
    ).toThrow('sessionStorage unavailable');
    expect(tokens.getAccessToken()).toBeNull();
    expect(clearStoredSession).toHaveBeenCalledTimes(2);
  });

  it('maps Video/Task/Result and keeps Real runtime inactive', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({
          data: {
            items: [{ video: videoDto, analysis_task: taskDto }],
            page: 1,
            page_size: 20,
            total: 1,
            unfiltered_total: 1,
          },
        }),
      )
      .mockResolvedValueOnce(json({ data: { video: videoDto, analysis_task: taskDto } }))
      .mockResolvedValueOnce(json({ data: { task: taskDto } }))
      .mockResolvedValueOnce(json({ data: { result: resultDto } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createHttpClient({
      baseUrl: 'https://api.example.com/api/v1',
      fetchImpl,
      accessTokenProvider: new AccessTokenStore(),
    });
    const videos = new RealWebVideoService(client);
    const analysis = new RealWebAnalysisService(client);
    const params = {
      actorUserId: 'admin-1',
      keyword: '',
      uploadStatus: 'all' as const,
      analysisStatus: 'all' as const,
      from: null,
      to: null,
      page: 1,
      pageSize: 20 as const,
    };
    await expect(videos.listVideos(params)).resolves.toMatchObject({
      total: 1,
      unfilteredTotal: 1,
      items: [{ video: { id: 'video-1' } }],
    });
    await expect(
      videos.getVideoById({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ video: { id: 'video-1' } });
    await expect(
      analysis.getTaskStateByVideoId({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({
      task: { id: 'task-1' },
      runtimeActive: false,
      pollingActive: false,
    });
    await expect(
      analysis.getResultByVideoId({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).resolves.toMatchObject({ id: 'result-1' });
    await expect(
      videos.deleteVideo({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).resolves.toBeUndefined();
    await expect(
      analysis.retryAnalysis({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).rejects.toMatchObject({ code: 'REAL_RETRY_CONTRACT_NOT_CONFIGURED' });
    await expect(
      analysis.getCvDemoOutputByVideoId({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).rejects.toMatchObject({ code: 'REAL_CV_CONTRACT_NOT_CONFIGURED' });
    await expect(
      analysis.getTaskLogsByVideoId({ actorUserId: 'admin-1', videoId: 'video-1' }),
    ).rejects.toMatchObject({ code: 'REAL_LOGS_CONTRACT_NOT_CONFIGURED' });
  });

  it('sets a source-neutral polling hint for active Real tasks only', async () => {
    const queued = { ...taskDto, status: 'queued', stage: 'queued', progress: 0 };
    const processing = {
      ...taskDto,
      status: 'processing',
      stage: 'ball_tracking',
      progress: 50,
    };
    const failed = {
      ...taskDto,
      status: 'failed',
      stage: 'ball_tracking',
      progress: 50,
      error_code: 'STUB_FAILED',
      error_message: 'Safe failure',
    };
    const canceled = { ...taskDto, status: 'canceled', stage: 'ball_tracking', progress: 50 };
    const fetchImpl = vi.fn<typeof fetch>();
    for (const task of [queued, processing, taskDto, failed, canceled, null]) {
      fetchImpl.mockResolvedValueOnce(json({ data: { task } }));
    }
    const service = new RealWebAnalysisService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: new AccessTokenStore(),
      }),
    );
    const request = { actorUserId: 'admin-1', videoId: 'video-1' };
    await expect(service.getTaskStateByVideoId(request)).resolves.toMatchObject({
      runtimeActive: false,
      pollingActive: true,
      task: { status: 'queued' },
    });
    await expect(service.getTaskStateByVideoId(request)).resolves.toMatchObject({
      runtimeActive: false,
      pollingActive: true,
      task: { status: 'processing' },
    });
    for (const status of ['succeeded', 'failed', 'canceled']) {
      await expect(service.getTaskStateByVideoId(request)).resolves.toMatchObject({
        runtimeActive: false,
        pollingActive: false,
        task: { status },
      });
    }
    await expect(service.getTaskStateByVideoId(request)).resolves.toEqual({
      task: null,
      runtimeActive: false,
      pollingActive: false,
    });
  });

  it('maps filtered and unfiltered totals and requires the Draft field', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        json({ data: { items: [], page: 1, page_size: 20, total: 0, unfiltered_total: 5 } }),
      )
      .mockResolvedValueOnce(json({ data: { items: [], page: 1, page_size: 20, total: 0 } }))
      .mockResolvedValueOnce(
        json({ data: { items: [], page: 1, page_size: 20, total: 0, unfiltered_total: -1 } }),
      );
    const service = new RealWebVideoService(
      createHttpClient({
        baseUrl: 'https://api.example.com/api/v1',
        fetchImpl,
        accessTokenProvider: new AccessTokenStore(),
      }),
    );
    const params = {
      actorUserId: 'admin-1',
      keyword: 'missing',
      uploadStatus: 'all' as const,
      analysisStatus: 'all' as const,
      from: null,
      to: null,
      page: 1,
      pageSize: 20 as const,
    };
    await expect(service.listVideos(params)).resolves.toMatchObject({
      total: 0,
      unfilteredTotal: 5,
    });
    await expect(service.listVideos(params)).rejects.toMatchObject({
      code: 'REAL_API_RESPONSE_INVALID',
    });
    await expect(service.listVideos(params)).rejects.toMatchObject({
      code: 'REAL_API_RESPONSE_INVALID',
    });
    expect(
      videoListEnvelopeSchema.safeParse({
        data: { items: [], page: 1, page_size: 20, total: 0 },
      }).success,
    ).toBe(false);
    expect(
      videoListEnvelopeSchema.safeParse({
        data: { items: [], page: 1, page_size: 20, total: 0, unfiltered_total: -1 },
      }).success,
    ).toBe(false);
  });

  it('keeps DTO inputs immutable and rejects invalid result counts', () => {
    const parsedVideo = videoDtoSchema.parse(videoDto);
    const before = JSON.stringify(parsedVideo);
    expect(adaptVideoDto(parsedVideo).id).toBe('video-1');
    expect(JSON.stringify(parsedVideo)).toBe(before);
    const invalid = resultDtoSchema.parse({
      ...resultDto,
      summary: { ...resultDto.summary, total_rallies: 1 },
    });
    expect(() => adaptResultDto(invalid)).toThrow(
      expect.objectContaining({ code: 'REAL_API_RESPONSE_INVALID' }),
    );
    expect(videoDtoSchema.safeParse({ ...videoDto, file_size_bytes: -1 }).success).toBe(false);
    expect(videoDtoSchema.safeParse({ ...videoDto, created_at: 'invalid' }).success).toBe(false);
    expect(videoDtoSchema.safeParse({ ...videoDto, match_type: 'unknown' }).success).toBe(false);
    expect(
      taskDtoSchema.safeParse({ ...taskDto, status: 'failed', stage: 'ball_tracking' }).success,
    ).toBe(false);
    expect(
      resultDtoSchema.safeParse({
        ...resultDto,
        summary: { ...resultDto.summary, duration_seconds: Number.POSITIVE_INFINITY },
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
