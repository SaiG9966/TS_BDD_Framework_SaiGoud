import fs from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function printUsage() {
  console.log("Usage:");
  console.log("  npm run test:one -- --tag @tagName");
  console.log("  npm run test:one -- --file src/tests/features/file.feature");
  console.log("  npm run test:one -- --file basicControls.feature");
  console.log("  npm run test:one -- --tag @tagName --file basicControls.feature");
}

async function findFeatureByName(rootDir, fileName) {
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = await walk(fullPath);
        if (found) return found;
      } else if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
        return fullPath;
      }
    }

    return undefined;
  }

  return walk(rootDir);
}

async function resolveFeaturePath(input, cwd) {
  if (!input) return undefined;

  const maybePath = path.resolve(cwd, input);
  try {
    const stat = await fs.stat(maybePath);
    if (stat.isFile()) return maybePath;
  } catch {
    // Continue to filename search
  }

  const featuresRoot = path.resolve(cwd, "src/tests/features");
  const found = await findFeatureByName(featuresRoot, input);
  return found;
}

async function main() {
  const tag = getArg("--tag");
  const fileInput = getArg("--file");

  if (!tag && !fileInput) {
    printUsage();
    process.exit(1);
  }

  const cwd = process.cwd();
  const filePath = await resolveFeaturePath(fileInput, cwd);

  if (fileInput && !filePath) {
    console.error(`Feature file not found: ${fileInput}`);
    process.exit(1);
  }

  const cucumberBin = path.resolve(cwd, "node_modules/@cucumber/cucumber/bin/cucumber-js");
  const args = [cucumberBin, "--config", "src/config/cucumber.cjs"];

  if (tag) {
    args.push("--tags", tag);
  }

  const selectedFeaturePath = filePath ? path.relative(cwd, filePath).replace(/\\/g, "/") : "";

  const child = spawn(process.execPath, args, {
    cwd,
    env: {
      ...process.env,
      ...(selectedFeaturePath ? { FEATURE_PATH: selectedFeaturePath } : {}),
      ...(tag ? { TAGS: "" } : {}),
    },
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    // Generate Cucumber HTML report from JSON output
    const reportGen = path.resolve(__dirname, "reportGenerator.js");
    spawnSync(process.execPath, [reportGen], { cwd, stdio: "inherit" });
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
