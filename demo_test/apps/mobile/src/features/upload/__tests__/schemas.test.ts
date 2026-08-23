import { describe, expect, it } from 'vitest';

import { uploadFormSchema } from '../schemas';

const valid = {
  title: '训练视频',
  matchType: 'training',
  playMode: 'singles',
  courtType: 'hard',
  note: '',
} as const;

describe('uploadFormSchema', () => {
  it('trims the title and converts blank note to undefined', () => {
    expect(uploadFormSchema.parse({ ...valid, title: '  底线训练  ', note: '   ' })).toEqual({
      ...valid,
      title: '底线训练',
      note: undefined,
    });
  });

  it('rejects an empty title', () => {
    expect(uploadFormSchema.safeParse({ ...valid, title: '  ' }).success).toBe(false);
  });

  it('accepts 80 title characters and rejects 81', () => {
    expect(uploadFormSchema.safeParse({ ...valid, title: '网'.repeat(80) }).success).toBe(true);
    expect(uploadFormSchema.safeParse({ ...valid, title: '网'.repeat(81) }).success).toBe(false);
  });

  it('accepts 500 note characters and rejects 501', () => {
    expect(uploadFormSchema.safeParse({ ...valid, note: '球'.repeat(500) }).success).toBe(true);
    expect(uploadFormSchema.safeParse({ ...valid, note: '球'.repeat(501) }).success).toBe(false);
  });

  it.each([
    ['matchType', 'practice'],
    ['playMode', 'mixed'],
    ['courtType', 'carpet'],
  ] as const)('rejects invalid %s', (field, value) => {
    expect(uploadFormSchema.safeParse({ ...valid, [field]: value }).success).toBe(false);
  });

  it('accepts all approved enum values', () => {
    for (const matchType of ['training', 'match']) {
      for (const playMode of ['singles', 'doubles']) {
        for (const courtType of ['hard', 'clay', 'grass', 'other']) {
          expect(
            uploadFormSchema.safeParse({ ...valid, matchType, playMode, courtType }).success,
          ).toBe(true);
        }
      }
    }
  });
});
