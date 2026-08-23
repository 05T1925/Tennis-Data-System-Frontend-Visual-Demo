import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoMatchFixture } from '@tennis-ui/core';
import { App } from '../src/app/App';
import { getComparisonWidths } from '../src/pages/OverviewPage';

const page = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
const routed = (route: string) => {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries: [route] });
  return { router, ...render(<RouterProvider router={router} />) };
};
const createUrl = vi.fn((file: File) => `blob:${file.name}`);
const revokeUrl = vi.fn();
beforeEach(() => {
  createUrl.mockClear();
  revokeUrl.mockClear();
  vi.stubGlobal(
    'URL',
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Third performance lab', () => {
  it('redirects root to Video', async () => {
    const { router } = routed('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/video/demo-upload-001'));
  });
  it.each([
    ['/video/demo-upload-001', '视频分析终端'],
    ['/overview', '数据总览'],
    ['/rally?player=A', '击球与相持'],
    ['/serve?player=A', '发球分析'],
    ['/not-found-test', '页面未找到'],
  ] as const)('renders %s', (route, heading) => {
    page(route);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
  it('renders compact Lab Bar navigation', () => {
    page('/overview');
    expect(screen.getByRole('navigation', { name: '性能实验室导航' })).toBeInTheDocument();
    expect(screen.getByText('MPL')).toBeInTheDocument();
  });
  it('renders local-video empty stage', () => {
    page('/video/demo-upload-001');
    expect(screen.getByText('未加载演示视频')).toBeInTheDocument();
  });
  it('creates Object URL', () => {
    page('/video/demo-upload-001');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'one.mp4')] },
    });
    expect(createUrl).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('本地比赛视频')).toBeInTheDocument();
  });
  it('revokes Object URL on replacement', () => {
    page('/video/demo-upload-001');
    const input = screen.getByLabelText('选择本地视频');
    fireEvent.change(input, { target: { files: [new File(['a'], 'one.mp4')] } });
    fireEvent.change(input, { target: { files: [new File(['b'], 'two.mp4')] } });
    expect(revokeUrl).toHaveBeenCalledWith('blob:one.mp4');
  });
  it('revokes Object URL on unmount', () => {
    const view = page('/video/demo-upload-001');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'last.mp4')] },
    });
    view.unmount();
    expect(revokeUrl).toHaveBeenCalledWith('blob:last.mp4');
  });
  it('initializes analysis URL time', () => {
    page('/video/demo-upload-001?time=5000');
    expect(screen.getByRole('heading', { level: 2, name: /P1/ })).toBeInTheDocument();
  });
  it('synchronizes external URL time', async () => {
    const { router } = routed('/video/demo-upload-001?time=5000');
    await act(() =>
      router.navigate(`/video/demo-upload-001?time=${demoMatchFixture.points[1]!.startTimeMs}`),
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: /P2/ })).toBeInTheDocument(),
    );
  });
  it('keeps snapshot fixed on video time update', () => {
    page('/video/demo-upload-001?snapshot=1&time=5000');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'snap.mp4')] },
    });
    const video = screen.getByLabelText('本地比赛视频');
    Object.defineProperty(video, 'duration', { configurable: true, value: 120 });
    Object.defineProperty(video, 'currentTime', { configurable: true, value: 90 });
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    expect(screen.getByRole('heading', { level: 2, name: /P1/ })).toBeInTheDocument();
  });
  it('navigates previous point from a gap', async () => {
    const first = demoMatchFixture.points[0]!;
    const { router } = routed(`/video/demo-upload-001?time=${first.endTimeMs + 100}`);
    fireEvent.click(screen.getByRole('button', { name: '上一分' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?time=${first.startTimeMs}`));
  });
  it('navigates next point from a gap', async () => {
    const first = demoMatchFixture.points[0]!,
      second = demoMatchFixture.points[1]!;
    const { router } = routed(`/video/demo-upload-001?time=${first.endTimeMs + 100}`);
    fireEvent.click(screen.getByRole('button', { name: '下一分' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?time=${second.startTimeMs}`));
  });
  it('does not loop after final point', () => {
    page(`/video/demo-upload-001?time=${demoMatchFixture.video.durationMs}`);
    expect(screen.getByRole('button', { name: '下一分' })).toBeDisabled();
  });
  it('shows complete Point and Shot telemetry', () => {
    page('/video/demo-upload-001?time=5000');
    expect(screen.getByText('发球 / 接发')).toBeInTheDocument();
    expect(screen.getByText('置信度')).toBeInTheDocument();
  });
  it('renders Overview session matrix, comparison, insight and Clips', () => {
    page('/overview');
    expect(screen.getByText('ACTIVE SESSION')).toBeInTheDocument();
    expect(screen.getByText('A/B SCORE MATRIX')).toBeInTheDocument();
    expect(screen.getByText('OBSERVATION')).toBeInTheDocument();
    expect(within(screen.getByText('CLIP INDEX').parentElement!).getAllByRole('link')).toHaveLength(
      5,
    );
  });
  it('uses data-driven comparison tracks instead of a fixed width', () => {
    page('/overview');
    const forced = document.querySelector('[data-metric-code="forced_error_count"]')!;
    const [a, b] = Array.from(forced.querySelectorAll<HTMLElement>('[data-track]'));
    expect(a).toHaveAttribute('data-track', 'A');
    expect(b).toHaveAttribute('data-track', 'B');
    expect(Number(a?.dataset.trackWidth)).toBeGreaterThan(Number(b?.dataset.trackWidth));
    expect(b?.dataset.trackWidth).toBe('0.00');
    expect(a).toHaveAttribute('style', expect.stringContaining('--value: 100%'));
    expect(document.querySelector('.comparison-row i')).toBeNull();
  });
  it('renders equal count and rate comparison tracks at equal widths', () => {
    page('/overview');
    for (const code of [
      'point_won_count',
      'point_win_rate',
      'winner_count',
      'unforced_error_count',
    ]) {
      const tracks = document.querySelectorAll<HTMLElement>(
        `[data-metric-code="${code}"] [data-track]`,
      );
      expect(tracks).toHaveLength(2);
      expect(tracks[0]?.dataset.trackWidth).toBe(tracks[1]?.dataset.trackWidth);
    }
  });
  it('keeps zero comparison widths finite and safe', () => {
    expect(
      getComparisonWidths(
        { metricUnit: 'count', metricValue: 0 },
        { metricUnit: 'count', metricValue: 0 },
      ),
    ).toEqual({ a: 0, b: 0 });
    expect(
      getComparisonWidths(
        { metricUnit: 'rate', metricValue: 0.5 },
        { metricUnit: 'rate', metricValue: 0.5 },
      ),
    ).toEqual({ a: 50, b: 50 });
  });
  it('renders empty Video fixture data and analysis time', () => {
    page('/video/demo-upload-001?snapshot=1&time=35000');
    expect(screen.getByText('FIXTURE 02:00')).toBeInTheDocument();
    expect(screen.getByText('12 POINTS')).toBeInTheDocument();
    expect(screen.getByText('69 SHOTS')).toBeInTheDocument();
    expect(screen.getByText('ANALYSIS 00:35')).toBeInTheDocument();
    expect(screen.getByText('MP4 / WEBM / QUICKTIME')).toBeInTheDocument();
    expect(screen.getByLabelText('选择本地视频')).toBeInTheDocument();
  });
  it('keeps Snapshot controls disabled in the empty Video state', () => {
    page('/video/demo-upload-001?snapshot=1&time=35000');
    expect(screen.getByRole('button', { name: '上一分' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一分' })).toBeDisabled();
  });
  it('renders Rally A and B player state', () => {
    const view = page('/rally?player=A');
    expect(screen.getByRole('button', { name: /A \/ PLAYER A/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    view.unmount();
    page('/rally?player=B');
    expect(screen.getByRole('button', { name: /B \/ PLAYER B/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
  it('renders Rally hand profile and P0/P1', () => {
    page('/rally?player=A');
    const profile = screen.getByLabelText('正反手结构');
    expect(within(profile).getByText('正手')).toBeInTheDocument();
    expect(within(profile).getByText('反手')).toBeInTheDocument();
    expect(screen.getByText('OUTPUT / P0')).toBeInTheDocument();
    expect(screen.getByText('STABILITY / P1')).toBeInTheDocument();
  });
  it('marks Rally error and endPoint in SVG', () => {
    page('/rally?player=A');
    expect(document.querySelectorAll('.dark-court .error').length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('.dark-court [data-position-source="end"]').length,
    ).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('[data-marker-offset="deterministic"]').length,
    ).toBeGreaterThan(0);
  });
  it('switches Serve Player query', async () => {
    const { router } = routed('/serve?player=A&snapshot=1');
    fireEvent.click(screen.getByRole('button', { name: /B \/ PLAYER B/ }));
    await waitFor(() => expect(router.state.location.search).toContain('player=B'));
    expect(router.state.location.search).toContain('snapshot=1');
  });
  it('renders both Serve telemetry panels with km/h', () => {
    page('/serve?player=A');
    expect(screen.getByText('FIRST SERVE')).toBeInTheDocument();
    expect(screen.getByText('SECOND SERVE')).toBeInTheDocument();
    expect(screen.getAllByText(/km\/h/).length).toBeGreaterThan(4);
    expect(screen.getByText('4 / 6')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });
  it('uses bilingual Deuce and Ad serve filters', () => {
    page('/serve?player=A');
    expect(screen.getByRole('button', { name: '平分区 / Deuce' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '占先区 / Ad' })).toBeInTheDocument();
  });
  it('renders fault and endPoint in Serve court', () => {
    page('/serve?player=A');
    expect(document.querySelectorAll('.dark-serve-court .error').length).toBeGreaterThan(0);
    expect(
      document.querySelectorAll('.dark-serve-court [data-position-source="end"]').length,
    ).toBeGreaterThan(0);
    expect(document.querySelectorAll('.dark-serve-court .service-winner').length).toBeGreaterThan(
      0,
    );
    expect(
      document.querySelectorAll('[data-marker-offset="deterministic"]').length,
    ).toBeGreaterThan(0);
  });
  it('keeps Player B zero Ace as a sample evidence', () => {
    page('/serve?player=B');
    const line = screen.getByText('Ace 率').closest('.metric-readout')!;
    expect(within(line as HTMLElement).getByText('0.0%')).toBeInTheDocument();
    expect(within(line as HTMLElement).getByRole('link', { name: /查看样本/ })).toBeInTheDocument();
  });
  it('renders distinct A and B track semantics for every comparison row', () => {
    page('/overview');
    expect(document.querySelectorAll('[data-track="A"]')).toHaveLength(5);
    expect(document.querySelectorAll('[data-track="B"]')).toHaveLength(5);
  });
  it('keeps Rally marker semantics for normal, winner, error and endPoint samples', () => {
    page('/rally?player=A');
    expect(document.querySelectorAll('.dark-court .mark').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.dark-court .winner').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.dark-court .error').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.dark-court .endpoint-mark').length).toBeGreaterThan(0);
  });
  it.each(['/video/demo-upload-001', '/overview', '/rally?player=A', '/serve?player=A'])(
    'has one h1 and no invalid values at %s',
    (route) => {
      page(route);
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      expect(document.body.textContent).not.toMatch(/undefined|NaN|Infinity|\[object Object\]/);
    },
  );
});
