import fs from "node:fs/promises";
import path from "node:path";

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function toPascalCase(value) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function normalizeExpression(stepText) {
  return stepText
    .replace(/"[^"]*"/g, "{string}")
    .replace(/'[^']*'/g, "{string}")
    .replace(/<[^>]+>/g, "{string}")
    .replace(/\b\d+\.\d+\b/g, "{float}")
    .replace(/\b\d+\b/g, "{int}")
    .trim();
}

function extractSteps(featureContent) {
  const lines = featureContent.split(/\r?\n/);
  const steps = [];
  const unique = new Set();
  let previousKeyword = "Given";

  for (const line of lines) {
    const match = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/);
    if (!match) continue;

    const [, rawKeyword, rawText] = match;
    const keyword = rawKeyword === "And" || rawKeyword === "But" ? previousKeyword : rawKeyword;
    previousKeyword = keyword;

    const expression = normalizeExpression(rawText);
    const uniqueKey = `${keyword}|${expression}`;
    if (unique.has(uniqueKey)) continue;

    unique.add(uniqueKey);
    steps.push({ keyword, expression, original: rawText.trim() });
  }

  return steps;
}

function escapeForDoubleQuotes(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildStepImplementation(step) {
  const placeholderMatches = [...step.expression.matchAll(/\{(string|int|float|word)\}/g)];
  const params = placeholderMatches.map((m, index) => {
    const type = m[1] === "int" || m[1] === "float" ? "number" : "string";
    return { name: `arg${index + 1}`, type };
  });

  const args = params.length ? `, ${params.map((p) => `${p.name}: ${p.type}`).join(", ")}` : "";
  const escapedExpression = escapeForDoubleQuotes(step.expression);

  return `${step.keyword}("${escapedExpression}", async function (this: CustomWorld${args}) {\n  // TODO: Implement step: ${step.original}\n  throw new Error("Step not implemented.");\n});`;
}

function readExistingStepDefinitions(content) {
  const existing = new Set();
  const regex = /\b(Given|When|Then)\("([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    existing.add(`${match[1]}|${match[2]}`);
  }
  return existing;
}

async function main() {
  const featureArg = getArg("--feature");
  const outArg = getArg("--out");
  const force = hasFlag("--force");

  if (!featureArg) {
    console.error(
      "Usage: npm run steps:generate -- --feature <feature-file> [--out <step-def-file>] [--force]"
    );
    process.exit(1);
  }

  const cwd = process.cwd();
  const featurePath = path.resolve(cwd, featureArg);

  let featureContent;
  try {
    featureContent = await fs.readFile(featurePath, "utf-8");
  } catch {
    console.error(`Feature file not found: ${featurePath}`);
    process.exit(1);
  }

  const steps = extractSteps(featureContent);
  if (steps.length === 0) {
    console.error("No steps found in feature file. Use Given/When/Then/And/But lines.");
    process.exit(1);
  }

  const defaultFileName = `${toPascalCase(path.basename(featurePath, path.extname(featurePath)))}Steps.ts`;
  const outputPath = outArg
    ? path.resolve(cwd, outArg)
    : path.resolve(cwd, "src/tests/stepDefinitions", defaultFileName);

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  const supportWorldPath = path.resolve(cwd, "src/tests/support/customWorld.ts");
  const worldImportPath = path.relative(outputDir, supportWorldPath).replace(/\\/g, "/");
  const worldImport = worldImportPath.startsWith(".") ? worldImportPath : `./${worldImportPath}`;

  const generatedBlocks = steps.map(buildStepImplementation);

  try {
    const existing = await fs.readFile(outputPath, "utf-8");
    const existingDefinitions = readExistingStepDefinitions(existing);
    const missingBlocks = steps
      .filter((step) => !existingDefinitions.has(`${step.keyword}|${step.expression}`))
      .map(buildStepImplementation);

    if (force) {
      const header = `import { Given, When, Then } from "@cucumber/cucumber";\nimport { CustomWorld } from "${worldImport}";\n\n`;
      await fs.writeFile(outputPath, `${header}${generatedBlocks.join("\n\n")}\n`, "utf-8");
      console.log(`Step definition file overwritten: ${outputPath}`);
      return;
    }

    if (missingBlocks.length === 0) {
      console.log(`No new steps to add. File already up to date: ${outputPath}`);
      return;
    }

    const contentToAppend = `\n\n// Auto-generated step definitions from ${path.basename(featurePath)}\n${missingBlocks.join("\n\n")}\n`;
    await fs.appendFile(outputPath, contentToAppend, "utf-8");
    console.log(`Added ${missingBlocks.length} new step(s) to: ${outputPath}`);
    return;
  } catch {
    const header = `import { Given, When, Then } from "@cucumber/cucumber";\nimport { CustomWorld } from "${worldImport}";\n\n`;
    await fs.writeFile(outputPath, `${header}${generatedBlocks.join("\n\n")}\n`, "utf-8");
    console.log(`Step definition file created: ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
