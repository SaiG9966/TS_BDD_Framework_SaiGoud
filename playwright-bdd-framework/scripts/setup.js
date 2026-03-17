import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frameworkRoot = path.resolve(__dirname, "..");

// Resolve npm command: prefer npm_execpath (set by npm run), fallback to "npm"
const npmCli = process.env.npm_execpath || null;
const isWindows = process.platform === "win32";

function run(command, args, cwd, title) {
  console.log(`\n=== ${title} ===`);
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: true  // shell:true ensures npm/node are found on PATH in all environments (VS Code, CI, editors)
  });

  if (result.error) {
    throw new Error(`${title} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${title} failed with exit code ${result.status ?? 1}`);
  }
}

function runNpm(args, cwd, title) {
  if (npmCli) {
    // Running via `npm run setup` — use node + npm_execpath for reliability
    run(process.execPath, [npmCli, ...args], cwd, title);
  } else {
    // Fallback: run npm directly (works in VS Code terminals, CI, direct invocations)
    const npmCmd = isWindows ? "npm.cmd" : "npm";
    run(npmCmd, args, cwd, title);
  }
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
    console.log("✅ Created .env from .env.example");
  } else {
    console.log("ℹ️  .env already exists — keeping current values.");
  }
}

function checkJava() {
  const result = spawnSync("java", ["-version"], {
    cwd: frameworkRoot,
    stdio: "pipe",
    shell: true
  });

  if (result.status !== 0) {
    console.warn("\n⚠️  [Warning] Java is not available in PATH.");
    console.warn("   Allure report commands need Java 11+.");
    console.warn("   Install Java and reopen your terminal to enable: npm run report\n");
  } else {
    console.log("✅ Java detected (required for Allure report generation).");
  }
}

function installPlaywrightBrowsers() {
  // Try `npx playwright install --with-deps` first (installs OS deps on Linux/CI)
  // Falls back to `npx playwright install` if --with-deps fails
  const npxCmd = isWindows ? "npx.cmd" : "npx";

  console.log("\n=== Install Playwright browsers ===");
  const result = spawnSync(npxCmd, ["playwright", "install", "--with-deps"], {
    cwd: frameworkRoot,
    stdio: "inherit",
    shell: true
  });

  if (result.status !== 0) {
    console.warn("⚠️  --with-deps failed (may need admin/sudo). Retrying without --with-deps...");
    const fallback = spawnSync(npxCmd, ["playwright", "install"], {
      cwd: frameworkRoot,
      stdio: "inherit",
      shell: true
    });
    if (fallback.status !== 0) {
      throw new Error(`Playwright browser installation failed with exit code ${fallback.status ?? 1}`);
    }
  }
}

try {
  checkJava();

  runNpm(["install"], frameworkRoot, "Install framework dependencies");

  installPlaywrightBrowsers();

  ensureEnvFile();

  console.log("\n✅ Setup completed successfully!");
  console.log("─────────────────────────────────────");
  console.log("  Run tests  :  npm run test");
  console.log("  Single test:  npm run test:one");
  console.log("  Reports    :  npm run test:report");
  console.log("─────────────────────────────────────\n");
} catch (error) {
  console.error(`\n❌ Setup failed: ${error.message}`);
  console.error("   Try running manually: cd playwright-bdd-framework && npm install");
  process.exit(1);
}
