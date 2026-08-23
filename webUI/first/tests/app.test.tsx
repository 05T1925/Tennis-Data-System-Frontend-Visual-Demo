import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../src/app/App';
import { OverviewInsightCard } from '../src/pages/OverviewPage';
const renderRoute = (route: string) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
describe('First-1 shell', () => {
  it('redirect route renders video page', () => {
    renderRoute('/');
    expect(screen.getByRole('heading', { name: '视频详情' })).toBeInTheDocument();
  });
  it.each([
    ['/overview', '数据总览'],
    ['/rally', '击球与相持'],
    ['/serve', '发球分析'],
  ])('renders %s', (route, title) => {
    renderRoute(route);
    expect(screen.getByRole('heading', { name: title, level: 2 })).toBeInTheDocument();
  });
  it('renders 404 and navigation without invalid display values', () => {
    renderRoute('/not-found-test');
    expect(screen.getByRole('heading', { name: '页面未找到' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(document.body.textContent).not.toMatch(/undefined|NaN|Infinity|\[object Object\]/);
  });

  it('renders the video detail placeholder, metrics, and twelve accessible point nodes', () => {
    renderRoute('/video/demo-upload-001');
    expect(screen.getByText('未加载演示视频')).toBeInTheDocument();
    expect(screen.getByLabelText('选择本地视频')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /第 \d+ 分/ })).toHaveLength(12);
    expect(screen.getByText('核心数据摘要')).toBeInTheDocument();
    expect(screen.getAllByText('P1').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/个样本/).length).toBeGreaterThan(0);
  });

  it('updates selected point from timeline and clips, and preserves snapshot time', () => {
    const detail = renderRoute('/video/demo-upload-001?time=0');
    fireEvent.click(screen.getByRole('button', { name: /第 2 分/ }));
    expect(screen.getByText(/当前 Point 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ace 发球/ }));
    expect(screen.getByText(/当前 Point 1/)).toBeInTheDocument();
    detail.unmount();
    renderRoute('/video/demo-upload-001?snapshot=1&time=35000');
    expect(screen.getByText('Snapshot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /第 1 分/ })).toBeDisabled();
  });

  it('uses safe URL fallback and gap state without a current shot', () => {
    const gap = renderRoute('/video/demo-upload-001?time=5731');
    expect(screen.getByText('分间间歇')).toBeInTheDocument();
    expect(screen.getAllByText('暂无当前拍').length).toBeGreaterThan(0);
    gap.unmount();
    renderRoute('/video/demo-upload-001?time=not-a-number');
    expect(screen.getByText('等待第一分')).toBeInTheDocument();
  });

  it('renders precise Point and Shot ranges plus zero-event sample wording', () => {
    renderRoute('/video/demo-upload-001?time=5000');
    expect(screen.getAllByText('时间范围')).toHaveLength(2);
    expect(document.body.textContent).toMatch(/\d\d:\d\d\.\d{3}–\d\d:\d\d\.\d{3}/);
    expect(screen.getAllByRole('button', { name: '查看样本' }).length).toBeGreaterThan(0);
  });

  it('renders overview conclusions, evidence navigation, and P1 disclosure', () => {
    renderRoute('/overview?snapshot=1');
    expect(screen.getByRole('heading', { name: '得分结构对比' })).toBeInTheDocument();
    expect(screen.getByText('本场优势', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/P1 规则推断/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /查看证据|查看样本/ }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Player B 非受迫失误更多/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/样本：\d+ 个回合/).length).toBe(3);
  });

  it('uses player query fallback, switching, court filters, and rally evidence', () => {
    renderRoute('/rally?player=invalid');
    expect(screen.getByText('PLAYER A')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Player B/ }));
    expect(screen.getByText('PLAYER B')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '正手' }));
    expect(screen.getByRole('img', { name: 'Player B 网球场落点图' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /查看证据|查看样本/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '失误' }));
    expect(screen.getByText(/个失误/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '制胜分产出' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '稳定性与失误' })).toBeInTheDocument();
  });

  it('renders Player B serve analysis without an Ace event link', () => {
    renderRoute('/serve?player=B');
    expect(screen.getByRole('heading', { name: '一发' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Player B 发球落点图' })).toBeInTheDocument();
    expect(screen.getAllByText('查看样本').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ad' }));
    expect(screen.getAllByText(/个样本/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText('发球落点筛选')).toBeInTheDocument();
    expect(screen.getByText(/个 fault/)).toBeInTheDocument();
  });

  it('keeps P0 winner counts out of the P1 stability section', () => {
    renderRoute('/rally?player=A');
    const winnerSection = screen.getByRole('heading', { name: '制胜分产出' }).closest('section')!;
    const stabilitySection = screen
      .getByRole('heading', { name: '稳定性与失误' })
      .closest('section')!;
    expect(within(winnerSection).getByText('正手制胜分数')).toBeInTheDocument();
    expect(within(winnerSection).getByText('反手制胜分数')).toBeInTheDocument();
    expect(within(stabilitySection).queryByText('正手制胜分数')).not.toBeInTheDocument();
    expect(within(stabilitySection).queryByText('反手制胜分数')).not.toBeInTheDocument();
    expect(screen.getAllByText('正手制胜分数')).toHaveLength(1);
    expect(screen.getAllByText('反手制胜分数')).toHaveLength(1);
  });

  it('renders neutral insight with both player metrics and separate evidence', () => {
    render(
      <MemoryRouter>
        <OverviewInsightCard
          insight={{
            kind: 'neutral',
            playerSlot: 'ALL',
            title: '双方主要失误指标持平',
            evidenceCode: 'unforced_error_count',
            sampleSize: 12,
            dataTier: 'P1',
          }}
        />
      </MemoryRouter>,
    );
    const neutral = screen.getByTestId('neutral-insight');
    expect(within(neutral).getByText('Player A')).toBeInTheDocument();
    expect(within(neutral).getByText('Player B')).toBeInTheDocument();
    expect(within(neutral).getAllByRole('link', { name: /查看证据|查看样本/ })).toHaveLength(2);
    expect(within(neutral).queryByText(/本场问题 · Player/)).not.toBeInTheDocument();
  });
});
