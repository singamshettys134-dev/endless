const ringSize = 1000;
const history = [];

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] || 0;
}

export function recordMetric(metric) {
  history.push({
    timestamp: Date.now(),
    latencyMs: Number(metric.latencyMs || 0),
    cacheHit: Boolean(metric.cacheHit),
    degraded: Boolean(metric.degraded),
    stageMs: metric.stageMs || {},
  });

  if (history.length > ringSize) {
    history.shift();
  }
}

export function getMetricSnapshot() {
  const latencies = history.map((entry) => entry.latencyMs);
  const cacheHits = history.filter((entry) => entry.cacheHit).length;
  return {
    totalRequests: history.length,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    cacheHitRate: history.length ? (cacheHits / history.length) * 100 : 0,
    lastSamples: history.slice(-30),
    uptimeMs: Date.now() - serverStart,
  };
}

export function getRequestHistory() {
  return history.slice();
}

export const serverStart = Date.now();
