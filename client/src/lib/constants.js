export const CATEGORY_COLORS = {
  Gaming: '#8b5cf6', Music: '#ec4899', Tech: '#3b82f6', Cricket: '#22c55e',
  Cooking: '#f59e0b', Travel: '#06b6d4', Education: '#6366f1', Comedy: '#f97316',
  News: '#ef4444', Fitness: '#10b981', Movies: '#a855f7', Science: '#2dd4bf',
};
export const CATEGORIES = Object.keys(CATEGORY_COLORS);
export const TOTAL_FALLBACK = 100000;

export const formatCount = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0);
export const formatCompactCount = (value) => {
  const n = Number(value) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return formatCount(n);
};
