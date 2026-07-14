export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024;
export const MAX_VIDEO_TITLE_LENGTH = 80;
export const MAX_VIDEO_NOTE_LENGTH = 500;
export const UPLOAD_PROGRESS_POLL_INTERVAL_MS = 500;

export const SUPPORTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime'] as const;

export const matchTypeOptions = [
  { label: '训练', value: 'training' },
  { label: '比赛', value: 'match' },
] as const;

export const playModeOptions = [
  { label: '单打', value: 'singles' },
  { label: '双打', value: 'doubles' },
] as const;

export const courtTypeOptions = [
  { label: '硬地', value: 'hard' },
  { label: '红土', value: 'clay' },
  { label: '草地', value: 'grass' },
  { label: '其他', value: 'other' },
] as const;
