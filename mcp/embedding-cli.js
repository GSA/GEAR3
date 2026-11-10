#!/usr/bin/env node
/**
 * CLI for the GEAR semantic search index.
 *
 * Usage:
 *   node mcp/embedding-cli.js rebuild   # full nightly-style rebuild
 *   node mcp/embedding-cli.js refresh   # delta sweep (changed records only)
 *   node mcp/embedding-cli.js stats     # index health
 *   node mcp/embedding-cli.js query "natural language question"
 *
 * Useful for the initial index build and for ad-hoc verification; the scheduled
 * jobs in server.js call the same pipeline functions.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { runFullRebuild, runDeltaRefresh } = require('./embedding-pipeline');
const vectorStore = require('./vector-store');
const { embed } = require('./usai-client');

async function main() {
  const command = process.argv[2] || 'stats';

  switch (command) {
    case 'rebuild': {
      const summary = await runFullRebuild();
      console.log(JSON.stringify(summary, null, 2));
      break;
    }
    case 'refresh': {
      const summary = await runDeltaRefresh();
      console.log(JSON.stringify(summary, null, 2));
      break;
    }
    case 'stats': {
      const stats = await vectorStore.stats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    }
    case 'query': {
      const question = process.argv.slice(3).join(' ');
      if (!question) {
        console.error('Usage: node mcp/embedding-cli.js query "your question"');
        process.exitCode = 1;
        break;
      }
      const { vectors } = await embed([question], { inputType: 'search_query' });
      const results = await vectorStore.search(vectors[0], { limit: 10 });
      for (const r of results) {
        console.log(`${r.score.toFixed(4)}  [${r.entityType}] ${r.name} (id ${r.entityId})`);
      }
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Commands: rebuild | refresh | stats | query "<question>"');
      process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode || 0))
  .catch((err) => {
    console.error('[embedding-cli] fatal:', err.message);
    process.exit(1);
  });
