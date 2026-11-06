#!/usr/bin/env node
/**
 * CLI for the nightly taxonomy-gap analyzer.
 *
 * Usage:
 *   node mcp/taxonomy-gap-cli.js run     # run the full analysis now
 *   node mcp/taxonomy-gap-cli.js stats   # pending signal / recommendation counts
 *
 * Useful for ad-hoc / manual triggering outside the nightly cron schedule
 * (mirrors mcp/embedding-cli.js for the semantic search index). The scheduled
 * job in server.js calls the same runNightlyAnalysis() function.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { runNightlyAnalysis } = require('./taxonomy-gap-analyzer');
const { getPool } = require('./taxonomy-gap-signals');

async function stats() {
  const pool = getPool();
  const [[signalCounts]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(Processed = 0) AS pending
     FROM gear_log.taxonomy_gap_signal`
  );
  const [[recCounts]] = await pool.query(
    `SELECT COUNT(*) AS total, SUM(Status = 'pending') AS pending
     FROM gear_log.taxonomy_gap_recommendation`
  );
  return {
    signals: { total: Number(signalCounts.total) || 0, pending: Number(signalCounts.pending) || 0 },
    recommendations: { total: Number(recCounts.total) || 0, pending: Number(recCounts.pending) || 0 },
  };
}

async function main() {
  const command = process.argv[2] || 'stats';

  switch (command) {
    case 'run': {
      const summary = await runNightlyAnalysis();
      console.log(JSON.stringify(summary, null, 2));
      break;
    }
    case 'stats': {
      console.log(JSON.stringify(await stats(), null, 2));
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Commands: run | stats');
      process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode || 0))
  .catch((err) => {
    console.error('[taxonomy-gap-cli] fatal:', err.message);
    process.exit(1);
  });
