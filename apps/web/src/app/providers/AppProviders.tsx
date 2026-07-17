import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import type { ReactNode } from 'react';

import { WebAuthProvider } from '../../features/auth';
import { WebQueryProvider } from './WebQueryProvider';
import 'antd/dist/reset.css';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#176b4d',
          colorBgLayout: '#f3f5f4',
          colorText: '#18231e',
          colorTextSecondary: '#5f6d66',
          borderRadius: 6,
          fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Layout: {
            bodyBg: '#f3f5f4',
            headerBg: '#ffffff',
            siderBg: '#153c31',
          },
          Menu: {
            darkItemBg: '#153c31',
            darkItemSelectedBg: '#28775c',
          },
        },
      }}
    >
      <WebQueryProvider>
        <WebAuthProvider>{children}</WebAuthProvider>
      </WebQueryProvider>
    </ConfigProvider>
  );
}
