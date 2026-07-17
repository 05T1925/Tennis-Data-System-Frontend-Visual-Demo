import { Card, Empty, List, Typography } from 'antd';

type ModulePlaceholderProps = {
  title: string;
  currentState: string;
  nextCapabilities: string[];
};

export function ModulePlaceholder({
  title,
  currentState,
  nextCapabilities,
}: ModulePlaceholderProps) {
  return (
    <Card className="module-placeholder" variant="outlined">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={currentState}>
        <Typography.Text strong>{title}</Typography.Text>
      </Empty>
      <List
        className="capability-list"
        size="small"
        header={<Typography.Text type="secondary">后续阶段能力</Typography.Text>}
        dataSource={nextCapabilities}
        renderItem={(item) => <List.Item>{item}</List.Item>}
      />
    </Card>
  );
}
