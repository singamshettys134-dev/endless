export const appConfig = {
  port: Number(process.env.PORT || 4000),
  videoCount: Number(process.env.VIDEO_COUNT || 100000),
  frontendHost: process.env.FRONTEND_HOST || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || '',
  sessionTtlMs: 15 * 60 * 1000,
  cursorTtlMs: 15 * 60 * 1000,
  requestLimitPerMinute: 300,
  secret: process.env.CURSOR_SECRET || 'endless-demo-secret',
};

export const categories = [
  'Gaming',
  'Music',
  'Tech',
  'Cricket',
  'Cooking',
  'Travel',
  'Education',
  'Comedy',
  'News',
  'Fitness',
  'Movies',
  'Science',
];

export const categoryColors = {
  Gaming: '#8b5cf6',
  Music: '#ec4899',
  Tech: '#3b82f6',
  Cricket: '#22c55e',
  Cooking: '#f59e0b',
  Travel: '#06b6d4',
  Education: '#6366f1',
  Comedy: '#f97316',
  News: '#ef4444',
  Fitness: '#10b981',
  Movies: '#a855f7',
  Science: '#2dd4bf',
};
