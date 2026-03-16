/**
 * Retry / Rerun Summary Reporter
 *
 * Parses Allure result JSON files after a test run and prints a summary of:
 *   - Scenarios that were retried
 *   - Final pass/fail outcome per retried scenario
 *
 * Usage:
 *   npm run test:retry-report
 *
 * Run automatically after: npm run test:report or npm run test:report:no-open
 */

import fs from "node:fs/promises";
import path from "node:path";

const RESULTS_DIR = process.env.ALLURE_RESULTS_DIR
  ? path.resolve(process.cwd(), process.env.ALLURE_RESULTS_DIR)
  : path.resolve(process.cwd(), "allure-results");

async function loadResults() {
  let entries;
  try {
    entries = await fs.readdir(RESULTS_DIR);
  } catch {
    console.warn(`\nNo allure-results folder found at: ${RESULTS_DIR}`);
    return [];
  }

  const resultFiles = entries.filter((f) => f.endsWith("-result.json"));
  const results = [];

  for (const file of resultFiles) {
    try {
      const raw = await fs.readFile(path.join(RESULTS_DIR, file), "utf-8");
      results.push(JSON.parse(raw));
    } catch {
      // skip malformed
    }
  }

  return results;
}

function formatStatus(status) {
  const icons = { passed: "✅", failed: "❌", broken: "🟠", skipped: "⏭️" };
  return `${icons[status] ?? "❓"} ${status.toUpperCase()}`;
}

async function main() {
  const results = await loadResults();

  if (results.length === 0) {
    console.log("\nNo test results found. Run tests first.\n");
    return;
  }

  // Group by scenario name (historyId or name)
  const byName = new Map();

  for (const r of results) {
    const key = r.historyId || r.name;
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(r);
  }

  // Retried scenarios have more than 1 result entry
  const retried = [...byName.entries()].filter(([, runs]) => runs.length > 1);

  console.log("\n══════════════════════════════════════════════════════");
  console.log("  RETRY SUMMARY REPORT");
  console.log("══════════════════════════════════════════════════════");
  console.log(`  Total scenarios run : ${byName.size}`);
  console.log(`  Retried scenarios   : ${retried.length}`);
  console.log("══════════════════════════════════════════════════════\n");

  if (retried.length === 0) {
    console.log("  ✅ No scenarios were retried.\n");
    return;
  }

  for (const [name, runs] of retried) {
    const sorted = [...runs].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const finalStatus = sorted.at(-1)?.status ?? "unknown";

    console.log(`  Scenario : ${name}`);
    console.log(`  Attempts : ${runs.length}`);
    console.log(`  Final    : ${formatStatus(finalStatus)}`);

    for (let i = 0; i < sorted.length; i++) {
      console.log(`    Run ${i + 1}: ${formatStatus(sorted[i].status ?? "unknown")}`);
    }

    console.log();
  }

  const failedRetries = retried.filter(([, runs]) => {
    const last = [...runs].sort((a, b) => (a.start ?? 0) - (b.start ?? 0)).at(-1);
    return last?.status !== "passed";
  });

  if (failedRetries.length > 0) {
    console.log(`  ❌ ${failedRetries.length} scenario(s) still failing after all retries.\n`);
    process.exit(1);
  } else {
    console.log(`  ✅ All retried scenarios eventually passed.\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
