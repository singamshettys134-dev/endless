import autocannon from 'autocannon';
import fs from 'node:fs';

async function runScenario(label, sessionOffset = 0) {
  const result = await autocannon({
    url: 'http://localhost:4000/api/feed',
    connections: 100,
    duration: 20,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    setupRequest: (req) => {
      const session = `demo-${sessionOffset + Math.floor(Math.random() * 100)}`;
      const cursor = Math.random() > 0.4 ? '' : `mock`;
      req.path = `/api/feed?session=${session}&cache=on&limit=20${cursor ? '&cursor=' + cursor : ''}`;
      return req;
    },
  }, null, 2000);

  return {
    label,
    requestsPerSecond: result.requests.average,
    p50: result.latency.average,
    p95: result.latency.p95,
    p99: result.latency.p99,
    errors: result.errors,
  };
}

const cacheOn = await runScenario('cache ON', 1);
const cacheOff = await runScenario('cache OFF', 500);
const report = `# Load test results\n\n| Scenario | req/s | p50 | p95 | p99 | errors |\n|---|---:|---:|---:|---:|---:|\n| ${cacheOn.label} | ${cacheOn.requestsPerSecond.toFixed(2)} | ${cacheOn.p50.toFixed(2)} ms | ${cacheOn.p95.toFixed(2)} ms | ${cacheOn.p99.toFixed(2)} ms | ${cacheOn.errors} |\n| ${cacheOff.label} | ${cacheOff.requestsPerSecond.toFixed(2)} | ${cacheOff.p50.toFixed(2)} ms | ${cacheOff.p95.toFixed(2)} ms | ${cacheOff.p99.toFixed(2)} ms | ${cacheOff.errors} |\n`;

fs.writeFileSync('docs/loadtest-results.md', report);
console.log(report);
