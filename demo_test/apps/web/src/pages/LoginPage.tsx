import { LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';

import { webApiMode } from '../config/env';
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, useWebAuth } from '../features/auth';
import type { WebLoginCredentials } from '../features/auth';

export function LoginPage() {
  const { activeOperation, authError, login, signInDemo, clearAuthError } = useWebAuth();
  const isBusy = activeOperation !== null;
  const isMockMode = webApiMode.status === 'ready' && webApiMode.mode === 'mock';

  return (
    <main className="login-page" aria-busy={isBusy}>
      <section className="login-intro">
        <Typography.Text className="login-kicker">TENNIS VIDEO ANALYSIS</Typography.Text>
        <Typography.Title>网球视频分析系统</Typography.Title>
        <Typography.Paragraph>内部 Web 数据看板</Typography.Paragraph>
        <Typography.Paragraph type="secondary">
          用于内部团队查看视频、分析任务、CV 数据和统计结果的后台入口。业务数据将在后续阶段接入。
        </Typography.Paragraph>
      </section>
      <Card className="login-card" title="管理员登录" variant="outlined">
        <Space orientation="vertical" size="middle" className="full-width">
          <Alert
            type="warning"
            showIcon
            title={
              isMockMode
                ? '当前为本地 Mock 管理员登录，不代表正式权限系统。'
                : 'Real API 草案模式，不代表正式后端或正式权限系统已经完成。'
            }
          />
          {authError !== null && (
            <Alert
              type="error"
              showIcon
              closable
              title={authError.userMessage}
              onClose={clearAuthError}
            />
          )}
          <Form<WebLoginCredentials>
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => void login(values)}
            onValuesChange={clearAuthError}
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱。' },
                { type: 'email', message: '请输入有效的邮箱地址。' },
              ]}
            >
              <Input prefix={<MailOutlined />} autoComplete="username" disabled={isBusy} />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码。' },
                { min: 8, message: '密码至少需要 8 位。' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="current-password"
                disabled={isBusy}
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              icon={<LoginOutlined />}
              loading={activeOperation === 'password-login'}
              disabled={isBusy && activeOperation !== 'password-login'}
            >
              登录
            </Button>
          </Form>
          {isMockMode && (
            <>
              <Button
                block
                loading={activeOperation === 'demo-login'}
                disabled={isBusy && activeOperation !== 'demo-login'}
                onClick={() => void signInDemo()}
              >
                使用 Demo 管理员进入
              </Button>
              <div className="demo-credentials">
                <Typography.Text strong>公开 Demo 凭据</Typography.Text>
                <Typography.Text code>{DEMO_ADMIN_EMAIL}</Typography.Text>
                <Typography.Text code>{DEMO_ADMIN_PASSWORD}</Typography.Text>
              </div>
            </>
          )}
          <Typography.Text type="secondary">
            {isMockMode
              ? 'Backend、Real API 和正式权限均未接入；当前登录仅验证本地前端流程。'
              : '当前仅验证前端 Draft Contract；真实 Backend 和正式管理员授权尚未接入。'}
          </Typography.Text>
        </Space>
      </Card>
    </main>
  );
}
