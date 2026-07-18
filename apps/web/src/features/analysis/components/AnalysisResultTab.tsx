import { Alert, Button, Card, Descriptions, Space, Spin, Statistic, Tag } from 'antd';

import { formatDateTime } from '../../videos';
import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';
import {
  createSafeResultStatistic,
  formatOptionalNumber,
  getResultCompleteness,
} from '../presentation';
import { AnalysisStateNotice } from './AnalysisStateNotice';

export function AnalysisResultTab({ analysis }: { analysis: WebAnalysisDetailState }) {
  const resultQuery = analysis.resultQuery;
  if (!analysis.resultEnabled || !analysis.canDisplayResult) {
    if (analysis.resultEnabled && resultQuery.isPending)
      return <Spin description="正在加载结构化结果" />;
    if (analysis.resultEnabled && resultQuery.isError) {
      return (
        <Alert
          type="error"
          showIcon
          title="结构化结果加载失败"
          action={<Button onClick={() => void resultQuery.refetch()}>重新加载</Button>}
        />
      );
    }
    return (
      <AnalysisStateNotice
        state={analysis}
        dataLabel="结构化结果"
        onReload={() => void resultQuery.refetch()}
      />
    );
  }
  const result = resultQuery.data;
  if (!result) return null;
  const { summary } = result;
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <Alert
        type="info"
        showIcon
        title="本地 Demo 结构化结果"
        description="以下指标来自确定性前端 Fixture，不代表真实算法输出、专业评级或正式比赛结论。"
      />
      <Card
        title="结果摘要"
        extra={
          <Tag color={getResultCompleteness(result) === '完整数据' ? 'green' : 'orange'}>
            {getResultCompleteness(result)}
          </Tag>
        }
      >
        <div className="analysis-stat-grid">
          <Statistic
            title="分析时长"
            {...createSafeResultStatistic(summary.durationSeconds, { suffix: '秒' })}
          />
          <Statistic
            title="击球"
            {...createSafeResultStatistic(summary.totalShots, { integer: true })}
          />
          <Statistic
            title="回合"
            {...createSafeResultStatistic(summary.totalRallies, { integer: true })}
          />
          <Statistic
            title="得分点"
            {...createSafeResultStatistic(summary.totalPoints, { optional: true, integer: true })}
          />
          <Statistic
            title="平均每回合击球"
            {...createSafeResultStatistic(summary.averageShotsPerRally, { precision: 1 })}
          />
          <Statistic
            title="最长回合"
            {...createSafeResultStatistic(summary.longestRallyShots, {
              integer: true,
              suffix: '拍',
            })}
          />
          <Statistic
            title="平均球速"
            {...createSafeResultStatistic(summary.averageBallSpeedKmh, {
              optional: true,
              suffix: ' km/h',
              precision: 1,
            })}
          />
          <Statistic
            title="最高球速"
            {...createSafeResultStatistic(summary.maxBallSpeedKmh, {
              optional: true,
              suffix: ' km/h',
              precision: 1,
            })}
          />
        </div>
      </Card>
      <Card title="球员能力画像">
        {result.playerProfile ? (
          <Descriptions bordered column={{ xs: 1, md: 2, xl: 4 }}>
            <Descriptions.Item label="稳定性">
              {formatOptionalNumber(result.playerProfile.consistency, { digits: 1 })}
            </Descriptions.Item>
            <Descriptions.Item label="进攻">
              {formatOptionalNumber(result.playerProfile.attack, { digits: 1 })}
            </Descriptions.Item>
            <Descriptions.Item label="防守">
              {formatOptionalNumber(result.playerProfile.defense, { digits: 1 })}
            </Descriptions.Item>
            <Descriptions.Item label="移动">
              {formatOptionalNumber(result.playerProfile.movement, { digits: 1 })}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert type="warning" showIcon title="PlayerProfile 未提供，其他结果仍可查看。" />
        )}
      </Card>
      <Card title="开发信息" extra={<Tag>Demo</Tag>}>
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Result version">{result.version}</Descriptions.Item>
          <Descriptions.Item label="生成时间">{formatDateTime(result.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Shots">{result.shots.length}</Descriptions.Item>
          <Descriptions.Item label="Rallies">{result.rallies.length}</Descriptions.Item>
          <Descriptions.Item label="Points">{result.points?.length ?? '未提供'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
