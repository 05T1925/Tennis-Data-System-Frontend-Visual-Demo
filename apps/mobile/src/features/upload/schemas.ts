import { z } from 'zod';

import { MAX_VIDEO_NOTE_LENGTH, MAX_VIDEO_TITLE_LENGTH } from './constants';

export const uploadFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '请输入视频名称。')
    .max(MAX_VIDEO_TITLE_LENGTH, `视频名称不能超过 ${MAX_VIDEO_TITLE_LENGTH} 个字符。`),
  matchType: z.enum(['training', 'match']),
  playMode: z.enum(['singles', 'doubles']),
  courtType: z.enum(['hard', 'clay', 'grass', 'other']),
  note: z
    .string()
    .max(MAX_VIDEO_NOTE_LENGTH, `备注不能超过 ${MAX_VIDEO_NOTE_LENGTH} 个字符。`)
    .transform((value) => value.trim() || undefined),
});

export type UploadFormInput = z.input<typeof uploadFormSchema>;
export type UploadFormOutput = z.output<typeof uploadFormSchema>;
