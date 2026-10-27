/**
 * SkillSwap Controlled 3-5 Concurrent User Performance Test
 * 
 * Target Endpoints:
 * - Frontend Service: http://localhost:5173/ (Vite React SPA)
 * - Backend Service:  http://localhost:5000/api/health (Express API)
 *
 * Characteristics:
 * - Concurrency: 5 virtual users (staged ramp-up 1 -> 3 -> 5)
 * - Duration: 45 seconds total
 * - Safe & non-destructive: GET requests only
 * - Metrics: Total requests, success rate, throughput (RPS), min, mean, p50, p90, p95, p99, max latency
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  { name: 'frontend', url: 'http://localhost:5173/' },
  { name: 'backend_health', url: 'http://localhost:5000/api/health' }
];

const CONFIG = {
  durationSeconds: 45,
  maxVUs: 5,
  rampUpSeconds: 10,
  userDelayMinMs: 100,
  userDelayMaxMs: 300
};

const results = {
  testStart: new Date().toISOString(),
  testEnd: null,
  durationSeconds: CONFIG.durationSeconds,
  maxVUs: CONFIG.maxVUs,
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  latencies: [],
  endpointStats: {
    frontend: { requests: 0, success: 0, errors: 0, latencies: [] },
    backend_health: { requests: 0, success: 0, errors: 0, latencies: [] }
  }
};

function makeRequest(target) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    const req = http.get(target.url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const success = res.statusCode >= 200 && res.statusCode < 400;
        resolve({ target: target.name, durationMs, success, statusCode: res.statusCode });
      });
    });

    req.on('error', (err) => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({ target: target.name, durationMs, success: false, error: err.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      resolve({ target: target.name, durationMs, success: false, error: 'TIMEOUT' });
    });
  });
}

function calculatePercentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

async function runVirtualUser(vuId, stopTime) {
  // Stagger VU start for smooth ramp-up
  const rampDelay = (vuId - 1) * (CONFIG.rampUpSeconds / CONFIG.maxVUs) * 1000;
  await new Promise(r => setTimeout(r, rampDelay));

  console.log(`[VU ${vuId}] Started`);

  while (Date.now() < stopTime) {
    // Round-robin target selection
    for (const target of TARGETS) {
      if (Date.now() >= stopTime) break;

      const res = await makeRequest(target);
      results.totalRequests++;
      results.latencies.push(res.durationMs);

      const ep = results.endpointStats[res.target];
      ep.requests++;
      ep.latencies.push(res.durationMs);

      if (res.success) {
        results.successRequests++;
        ep.success++;
      } else {
        results.failedRequests++;
        ep.errors++;
      }

      // Small think time between user actions (100 - 300 ms)
      const thinkTime = Math.floor(Math.random() * (CONFIG.userDelayMaxMs - CONFIG.userDelayMinMs)) + CONFIG.userDelayMinMs;
      await new Promise(r => setTimeout(r, thinkTime));
    }
  }

  console.log(`[VU ${vuId}] Completed`);
}

async function main() {
  console.log('===============================================================');
  console.log('SkillSwap Controlled Performance Test (3-5 Concurrent Users)');
  console.log(`Start Time: ${results.testStart}`);
  console.log(`Target Concurrency: ${CONFIG.maxVUs} VUs`);
  console.log(`Total Duration: ${CONFIG.durationSeconds}s (Ramp-up: ${CONFIG.rampUpSeconds}s)`);
  console.log('Target URLs:');
  TARGETS.forEach(t => console.log(`  - ${t.name}: ${t.url}`));
  console.log('===============================================================\n');

  const startTime = Date.now();
  const stopTime = startTime + (CONFIG.durationSeconds * 1000);

  const vuPromises = [];
  for (let i = 1; i <= CONFIG.maxVUs; i++) {
    vuPromises.push(runVirtualUser(i, stopTime));
  }

  await Promise.all(vuPromises);
  const actualDurationSec = (Date.now() - startTime) / 1000;
  results.testEnd = new Date().toISOString();

  // Sort latencies for percentiles
  results.latencies.sort((a, b) => a - b);
  const allLat = results.latencies;
  const sumLat = allLat.reduce((acc, v) => acc + v, 0);

  const summary = {
    testStart: results.testStart,
    testEnd: results.testEnd,
    durationSeconds: Number(actualDurationSec.toFixed(2)),
    concurrentUsers: CONFIG.maxVUs,
    totalRequests: results.totalRequests,
    successfulRequests: results.successRequests,
    failedRequests: results.failedRequests,
    successRatePercent: Number(((results.successRequests / results.totalRequests) * 100).toFixed(2)),
    throughputRps: Number((results.totalRequests / actualDurationSec).toFixed(2)),
    latencyMs: {
      min: Number((allLat[0] || 0).toFixed(2)),
      mean: Number((sumLat / (allLat.length || 1)).toFixed(2)),
      p50: Number(calculatePercentile(allLat, 50).toFixed(2)),
      p90: Number(calculatePercentile(allLat, 90).toFixed(2)),
      p95: Number(calculatePercentile(allLat, 95).toFixed(2)),
      p99: Number(calculatePercentile(allLat, 99).toFixed(2)),
      max: Number((allLat[allLat.length - 1] || 0).toFixed(2))
    },
    endpointBreakdown: {}
  };

  for (const [epName, stat] of Object.entries(results.endpointStats)) {
    stat.latencies.sort((a, b) => a - b);
    const epSum = stat.latencies.reduce((a, b) => a + b, 0);
    summary.endpointBreakdown[epName] = {
      requests: stat.requests,
      successRatePercent: Number(((stat.success / (stat.requests || 1)) * 100).toFixed(2)),
      meanLatencyMs: Number((epSum / (stat.latencies.length || 1)).toFixed(2)),
      p95LatencyMs: Number(calculatePercentile(stat.latencies, 95).toFixed(2))
    };
  }

  // Save JSON report
  const jsonPath = path.join(__dirname, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  // Save Text report for evidence
  const evidenceDir = path.join(__dirname, '..', 'monitoring-evidence');
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  const textReportPath = path.join(evidenceDir, '02-load-test-report.txt');

  const reportText = `===============================================================
SkillSwap Performance Test Execution Report
===============================================================
Execution Window:   ${summary.testStart} to ${summary.testEnd}
Duration:           ${summary.durationSeconds} seconds
Concurrent Users:   ${summary.concurrentUsers} Virtual Users (Gradual Ramp-Up)
Total Requests:     ${summary.totalRequests}
Success Rate:       ${summary.successRatePercent}% (${summary.successfulRequests}/${summary.totalRequests})
Failed Requests:    ${summary.failedRequests}
Average Throughput: ${summary.throughputRps} requests/sec

Latency Distribution (Overall):
  Min Latency:      ${summary.latencyMs.min} ms
  Mean Latency:     ${summary.latencyMs.mean} ms
  P50 (Median):     ${summary.latencyMs.p50} ms
  P90:              ${summary.latencyMs.p90} ms
  P95:              ${summary.latencyMs.p95} ms
  P99:              ${summary.latencyMs.p99} ms
  Max Latency:      ${summary.latencyMs.max} ms

Endpoint Breakdown:
  - Frontend SPA (/):
      Requests:     ${summary.endpointBreakdown.frontend.requests}
      Success Rate: ${summary.endpointBreakdown.frontend.successRatePercent}%
      Mean Latency: ${summary.endpointBreakdown.frontend.meanLatencyMs} ms
      P95 Latency:  ${summary.endpointBreakdown.frontend.p95LatencyMs} ms
  - Backend API (/api/health):
      Requests:     ${summary.endpointBreakdown.backend_health.requests}
      Success Rate: ${summary.endpointBreakdown.backend_health.successRatePercent}%
      Mean Latency: ${summary.endpointBreakdown.backend_health.meanLatencyMs} ms
      P95 Latency:  ${summary.endpointBreakdown.backend_health.p95LatencyMs} ms
===============================================================
`;

  fs.writeFileSync(textReportPath, reportText);

  console.log('\n' + reportText);
  console.log(`Saved JSON summary to: ${jsonPath}`);
  console.log(`Saved Text report to:   ${textReportPath}`);
}

main().catch(err => {
  console.error('Fatal error executing test:', err);
  process.exit(1);
});
