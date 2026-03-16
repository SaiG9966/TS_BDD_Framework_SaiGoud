import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frameworkRoot = path.resolve(__dirname, "..");
const repoRoot = frameworkRoot; // In standalone mode, they are the same

const npmCli = process.env.npm_execpath;

function run(command, args, cwd, title) {
  console.log(`\n=== ${title} ===`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false
  });

  if (result.status !== 0) {
    throw new Error(`${title} failed with exit code ${result.status ?? 1}`);
  }
}

function runNpm(args, cwd, title) {
  if (!npmCli) {
    throw new Error("npm runtime metadata not found. Run setup with: npm run setup");
  }

  run(process.execPath, [npmCli, ...args], cwd, title);
}

function ensureEnvFile() {
  const examplePath = path.join(frameworkRoot, ".env.example");
  const envPath = path.join(frameworkRoot, ".env");

  if (!fs.existsSync(examplePath)) {
    console.warn(".env.example not found. Skipping .env bootstrap.");
    return;
  }

  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log("Created playwright-bdd-framework/.env from .env.example");
  } else {
    console.log("playwright-bdd-framework/.env already exists. Keeping current values.");
  }
}

function checkJava() {
  const result = spawnSync("java", ["-version"], {
    cwd: repoRoot,
    stdio: "pipe",
    shell: false
  });

  if (result.status !== 0) {
    console.warn("\n[Warning] Java is not available in PATH. Allure report commands need Java.");
    console.warn("Install Java 11+ and reopen terminal to use report/open-report commands.\n");
    return;
  }

  console.log("Java detected (required for Allure report generation).");
}

try {
  checkJava();
  console.log("\nSkipping root install inside setup script (avoids npm self-lock conflicts).");
  runNpm(["install"], frameworkRoot, "Install framework dependencies");
  runNpm(["exec", "playwright", "install"], frameworkRoot, "Install Playwright browsers");
  ensureEnvFile();

  console.log("\n✅ Setup completed.");
  console.log("Run tests with: npm run test");
  console.log("Run report with: npm run report");
} catch (error) {
  console.error(`\n❌ Setup failed: ${error.message}`);
  process.exit(1);
}
