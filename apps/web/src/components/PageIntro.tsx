import { Flex, Typography } from 'antd';
import type { ReactNode } from 'react';

type PageIntroProps = {
  title: string;
  description: string;
  extra?: ReactNode;
};

export function PageIntro({ title, description, extra }: PageIntroProps) {
  return (
    <Flex className="page-intro" justify="space-between" align="flex-start" gap={16} wrap>
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
      </div>
      {extra}
    </Flex>
  );
}
