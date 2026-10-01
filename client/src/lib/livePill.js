const numberFormat = new Intl.NumberFormat('en-US');

export const LIVE_PILL_PATH_PATTERNS = [
  /^\/$/,
  /^\/trending$/,
  /^\/explore$/,
  /^\/search$/,
  /^\/category\//,
];

export function shouldShowLivePill(pathname, fetchedCount = 0) {
  if (!pathname || !Number(fetchedCount)) return false;
  return LIVE_PILL_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function resolveFetchedLabel(total, fetchedCount) {
  const count = Number(fetchedCount) || 0;
  const knownTotal = Number(total);
  const formatNumber = (value) => numberFormat.format(Number(value));

  if (!Number.isFinite(knownTotal) || knownTotal <= 0) {
    return `${formatNumber(count)} fetched`;
  }

  return `${formatNumber(count)} of ${formatNumber(knownTotal)} fetched`;
}
