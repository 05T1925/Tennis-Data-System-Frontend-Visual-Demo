import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { demoMatchFixture } from '@tennis-ui/core';
import { App } from '../src/app/App';

const page = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );

const routedPage = (route: string) => {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: [route],
  });
  return { router, ...render(<RouterProvider router={router} />) };
};

const createObjectUrl = vi.fn((file: File) => `blob:${file.name}`);
const revokeObjectUrl = vi.fn();

beforeEach(() => {
  createObjectUrl.mockClear();
  revokeObjectUrl.mockClear();
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Second editorial prototype', () => {
  it('redirects the root route to video', async () => {
    const { router } = routedPage('/');
    await waitFor(() => expect(router.state.location.pathname).toBe('/video/demo-upload-001'));
  });

  it('renders all four routes and 404', () => {
    for (const [route, heading] of [
      ['/video/demo-upload-001', '视频详情'],
      ['/overview', '数据总览'],
      ['/rally?player=A', '击球与相持'],
      ['/serve?player=A', '发球分析'],
      ['/not-found-test', '页面未找到'],
    ] as const) {
      const view = page(route);
      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      view.unmount();
    }
  });

  it('renders default Player A on Serve', () => {
    page('/serve');
    expect(screen.getByRole('button', { name: 'PLAYER A' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders Player B from the Serve URL', () => {
    page('/serve?player=B');
    expect(screen.getByRole('button', { name: 'PLAYER B' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switches Serve players and preserves snapshot', async () => {
    const { router } = routedPage('/serve?snapshot=1&player=A');
    fireEvent.click(screen.getByRole('button', { name: 'PLAYER B' }));
    await waitFor(() => expect(router.state.location.search).toContain('player=B'));
    expect(router.state.location.search).toContain('snapshot=1');
  });

  it('creates a local Object URL', () => {
    page('/video/demo-upload-001');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'first.mp4', { type: 'video/mp4' })] },
    });
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('本地比赛视频')).toBeInTheDocument();
  });

  it('revokes the previous Object URL when replacing a file', () => {
    page('/video/demo-upload-001');
    const input = screen.getByLabelText('选择本地视频');
    fireEvent.change(input, { target: { files: [new File(['a'], 'first.mp4')] } });
    fireEvent.change(input, { target: { files: [new File(['b'], 'second.mp4')] } });
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:first.mp4');
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('revokes the current Object URL on unmount', () => {
    const view = page('/video/demo-upload-001');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'last.mp4')] },
    });
    view.unmount();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:last.mp4');
  });

  it('synchronizes analysis time after external URL navigation', async () => {
    const { router } = routedPage('/video/demo-upload-001?time=5000');
    expect(screen.getByRole('heading', { level: 2, name: 'P1' })).toBeInTheDocument();
    await act(() =>
      router.navigate(`/video/demo-upload-001?time=${demoMatchFixture.points[1]!.startTimeMs}`),
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'P2' })).toBeInTheDocument(),
    );
  });

  it('keeps Snapshot analysis time fixed during media timeupdate', () => {
    page('/video/demo-upload-001?snapshot=1&time=5000');
    fireEvent.change(screen.getByLabelText('选择本地视频'), {
      target: { files: [new File(['a'], 'snapshot.mp4')] },
    });
    const video = screen.getByLabelText('本地比赛视频') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 120 });
    Object.defineProperty(video, 'currentTime', { configurable: true, value: 90 });
    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);
    expect(screen.getByRole('heading', { level: 2, name: 'P1' })).toBeInTheDocument();
  });

  it('navigates to the correct previous point from a gap', async () => {
    const first = demoMatchFixture.points[0]!;
    const { router } = routedPage(`/video/demo-upload-001?time=${first.endTimeMs + 100}`);
    fireEvent.click(screen.getByRole('button', { name: '上一分' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?time=${first.startTimeMs}`));
  });

  it('navigates to the correct next point from a gap', async () => {
    const first = demoMatchFixture.points[0]!;
    const second = demoMatchFixture.points[1]!;
    const { router } = routedPage(`/video/demo-upload-001?time=${first.endTimeMs + 100}`);
    fireEvent.click(screen.getByRole('button', { name: '下一分' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?time=${second.startTimeMs}`));
  });

  it('does not loop to the first point after the final point', () => {
    page(`/video/demo-upload-001?time=${demoMatchFixture.video.durationMs}`);
    expect(screen.getByRole('button', { name: '下一分' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '上一分' })).toBeEnabled();
  });

  it('renders complete localized Point and Shot context', () => {
    page('/video/demo-upload-001?time=5000');
    expect(screen.getByText('发球 / 接发')).toBeInTheDocument();
    expect(screen.getByText('得分方')).toBeInTheDocument();
    expect(screen.getByText('关键分')).toBeInTheDocument();
    expect(screen.getByText('置信度')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/forehand|backhand|forced_error|unforced_error/);
  });

  it('renders Overview speed, movement and five shared Clips', () => {
    page('/overview');
    expect(screen.getByRole('heading', { name: '速度与移动' })).toBeInTheDocument();
    expect(screen.getByText('移动数据为确定性 Demo，用于三套原型统一比较。')).toBeInTheDocument();
    const index = screen.getByRole('heading', { name: '视频证据目录' }).parentElement!;
    expect(within(index).getAllByRole('link')).toHaveLength(5);
  });

  it('renders the complete Rally hand profile', () => {
    page('/rally?player=A');
    const profile = screen.getByLabelText('正反手结构');
    expect(within(profile).getByRole('heading', { name: '正手' })).toBeInTheDocument();
    expect(within(profile).getByRole('heading', { name: '反手' })).toBeInTheDocument();
    expect(within(profile).getAllByText('使用率')).toHaveLength(2);
    expect(within(profile).getAllByText('界内率')).toHaveLength(2);
  });

  it('renders each Serve result once and uses km/h for speed', () => {
    page('/serve?player=A');
    expect(screen.getAllByText('Ace 率')).toHaveLength(1);
    expect(screen.getAllByText('发球直接得分率')).toHaveLength(1);
    expect(screen.getAllByText('双误率')).toHaveLength(1);
    expect(screen.getAllByText(/km\/h/).length).toBeGreaterThanOrEqual(5);
  });

  it('keeps Player B zero Ace evidence isolated', () => {
    page('/serve?player=B');
    const aceLine = screen.getByText('Ace 率').closest<HTMLElement>('.metricLine')!;
    expect(within(aceLine).getByText('0.0%')).toBeInTheDocument();
    expect(within(aceLine).getByRole('link', { name: /查看样本/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/video/demo-upload-001?time='),
    );
  });

  it('marks Rally and Serve endPoint positions in SVG', () => {
    const rally = page('/rally?player=A');
    expect(document.querySelectorAll('.court [data-position-source="end"]').length).toBeGreaterThan(
      0,
    );
    rally.unmount();
    page('/serve?player=A');
    expect(
      document.querySelectorAll('.serveCourt [data-position-source="end"]').length,
    ).toBeGreaterThan(0);
  });

  it.each(['/video/demo-upload-001', '/overview', '/rally?player=A', '/serve?player=A'])(
    'has one h1 and no invalid rendered values on %s',
    (route) => {
      page(route);
      expect(document.querySelectorAll('h1')).toHaveLength(1);
      expect(document.body.textContent).not.toMatch(/undefined|NaN|Infinity|\[object Object\]/);
    },
  );
});
