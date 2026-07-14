import { z } from 'zod';

import { AUTH_SESSION_VERSION } from './types';

const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('请输入有效的邮箱地址。'),
  password: z.string().min(1, '请输入密码。').min(8, '密码至少需要 8 位。'),
  acceptedTerms: z.boolean().refine((accepted) => accepted, '请先同意用户协议和隐私政策。'),
});

const userSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin', 'developer']),
  avatarUrl: z.string().optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const authSessionSchema = z.object({
  version: z.literal(AUTH_SESSION_VERSION),
  token: z.string().min(1),
  user: userSchema,
});

export type LoginFormInput = z.input<typeof loginFormSchema>;
export type LoginFormValues = z.output<typeof loginFormSchema>;
