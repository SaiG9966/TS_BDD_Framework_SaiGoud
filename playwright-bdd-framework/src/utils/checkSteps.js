/**
 * Step Definition Quality Guard
 *
 * Scans all step definition files and feature files to find:
 *   1. Duplicate step expressions (same keyword + text defined more than once)
 *   2. Undefined steps (used in features but not defined in any step def file)
 *   3. Unused steps (defined but not referenced in any feature file)
 *
 * Usage:
 *   npm run steps:check
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STEP_DEFS_DIR = path.join(ROOT, "src/tests/stepDefinitions");
const FEATURES_DIR = path.join(ROOT, "src/tests/features");

async function walkFiles(dir, ext) {
  const result = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkFiles(full, ext)));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      result.push(full);
    }
  }
  return result;
}

function extractDefinedSteps(content, filePath) {
  const steps = [];
  const regex = /\b(Given|When|Then)\(\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    steps.push({
      keyword: match[1],
      expression: match[2].trim(),
      file: path.relative(ROOT, filePath),
    });
  }
  return steps;
}

function extractFeatureSteps(content, filePath) {
  const steps = [];
  const lines = content.split(/\r?\n/);
  let prevKeyword = "Given";

  for (const line of lines) {
    const match = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
    if (!match) continue;
    const kw = match[1] === "And" || match[1] === "But" ? prevKeyword : match[1];
    prevKeyword = kw;
    steps.push({
      keyword: kw,
      text: match[2].trim(),
      file: path.relative(ROOT, filePath),
    });
  }
  return steps;
}

function expressionMatchesText(expression, text) {
  const regexStr = expression
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\{string\\\}/g, '"[^"]*"')
    .replace(/\\\{int\\\}/g, "\\d+")
    .replace(/\\\{float\\\}/g, "[\\d.]+")
    .replace(/\\\{word\\\}/g, "\\S+");

  try {
    return new RegExp(`^${regexStr}$`).test(text);
  } catch {
    return false;
  }
}

function checkDuplicates(allDefined) {
  const seen = new Map();
  const duplicates = [];

  for (const step of allDefined) {
    const key = `${step.keyword}|${step.expression}`;
    if (seen.has(key)) {
      duplicates.push({ step, first: seen.get(key) });
    } else {
      seen.set(key, step);
    }
  }

  return duplicates;
}

function checkUndefined(featureSteps, allDefined) {
  const missing = [];

  for (const fStep of featureSteps) {
    const matched = allDefined.some(
      (d) => d.keyword === fStep.keyword && expressionMatchesText(d.expression, fStep.text)
    );
    if (!matched) {
      missing.push(fStep);
    }
  }

  return missing;
}

function checkUnused(allDefined, featureSteps) {
  return allDefined.filter((d) => {
    return !featureSteps.some((f) => f.keyword === d.keyword && expressionMatchesText(d.expression, f.text));
  });
}

async function main() {
  const stepFiles = await walkFiles(STEP_DEFS_DIR, ".ts");
  const featureFiles = await walkFiles(FEATURES_DIR, ".feature");

  const allDefined = [];
  for (const file of stepFiles) {
    const content = await fs.readFile(file, "utf-8");
    allDefined.push(...extractDefinedSteps(content, file));
  }

  const allFeatureSteps = [];
  for (const file of featureFiles) {
    const content = await fs.readFile(file, "utf-8");
    allFeatureSteps.push(...extractFeatureSteps(content, file));
  }

  const duplicates = checkDuplicates(allDefined);
  const undefinedSteps = checkUndefined(allFeatureSteps, allDefined);
  const unusedSteps = checkUnused(allDefined, allFeatureSteps);

  let hasIssues = false;

  if (duplicates.length > 0) {
    hasIssues = true;
    console.error(`\n❌ Duplicate step definitions (${duplicates.length}):`);
    for (const { step, first } of duplicates) {
      console.error(`   [${step.keyword}] "${step.expression}"`);
      console.error(`     first : ${first.file}`);
      console.error(`     second: ${step.file}`);
    }
  }

  if (undefinedSteps.length > 0) {
    hasIssues = true;
    console.error(`\n⚠️  Undefined steps in features (${undefinedSteps.length}):`);
    for (const s of undefinedSteps) {
      console.error(`   [${s.keyword}] "${s.text}"  →  ${s.file}`);
    }
  }

  if (unusedSteps.length > 0) {
    console.warn(`\n🔶 Unused step definitions (${unusedSteps.length}):`);
    for (const s of unusedSteps) {
      console.warn(`   [${s.keyword}] "${s.expression}"  →  ${s.file}`);
    }
  }

  if (!hasIssues && unusedSteps.length === 0) {
    console.log("\n✅ All step definitions are consistent with feature files.\n");
  } else if (!hasIssues) {
    console.log("\n✅ No critical step issues found (review unused steps above).\n");
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
