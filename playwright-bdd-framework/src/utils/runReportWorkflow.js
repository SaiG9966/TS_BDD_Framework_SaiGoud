import fs from "fs";
import path from "path";
import { spawnSync, spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frameworkRoot = path.resolve(__dirname, "../..");
const resultsDir = path.join(frameworkRoot, "allure-results");
const reportDir = path.join(frameworkRoot, "allure-report");

const shouldOpen = process.argv.includes("--open");

function runNpmScript(scriptName, { allowFailure = false } = {}) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error("npm runtime metadata not found. Please run this via npm scripts.");
    process.exit(1);
  }

  const result = spawnSync(process.execPath, [npmCli, "run", scriptName], {
    cwd: frameworkRoot,
    stdio: "inherit",
  });

  const code = result.status ?? 1;
  if (code !== 0 && !allowFailure) {
    process.exit(code);
  }
  return code;
}

function cleanResults() {
  if (fs.existsSync(resultsDir)) {
    fs.rmSync(resultsDir, { recursive: true, force: true });
    console.log("\n🧹 Cleared previous allure-results for a fresh report.\n");
  }
  fs.mkdirSync(resultsDir, { recursive: true });
}

function killExistingAllureServer() {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/f", "/im", "allure.cmd"], { shell: true, stdio: "ignore" });
    spawnSync("taskkill", ["/f", "/im", "java.exe", "/fi", "WINDOWTITLE eq allure*"], {
      shell: true,
      stdio: "ignore",
    });
  }
}

function hasResults() {
  if (!fs.existsSync(resultsDir)) return false;
  const entries = fs.readdirSync(resultsDir);
  return entries.length > 0;
}

function hasExistingReport() {
  return fs.existsSync(path.join(reportDir, "index.html"));
}

function openCucumberReportInBrowser() {
  const cucumberReportPath = path.join(frameworkRoot, "reports", "html-report", "index.html");
  if (!fs.existsSync(cucumberReportPath)) return;

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", cucumberReportPath], {
      cwd: frameworkRoot,
      shell: false,
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  const openCmd = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(openCmd, [cucumberReportPath], {
    cwd: frameworkRoot,
    detached: true,
    stdio: "ignore",
  }).unref();
}

function openReportInBrowser(testExitCode) {
  const port = Math.floor(Math.random() * (9000 - 5300)) + 5300; // Random port 5300-9000
  const allureBin = path.join(
    frameworkRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "allure.cmd" : "allure"
  );

  console.log("\nStarting Allure report server...\n");

  killExistingAllureServer();

  const server = spawn(allureBin, ["open", "allure-report", "--port", String(port)], {
    cwd: frameworkRoot,
    stdio: "inherit",
    shell: process.platform === "win32", // Use shell only on Windows for .cmd files
  });

  server.on("exit", () => {
    if (testExitCode !== 0) {
      console.warn("\nTests failed, but report steps were still executed.\n");
    }
    process.exit(testExitCode);
  });

  process.on("SIGINT", () => {
    server.kill();
  });
}

const testExitCode = (() => {
  cleanResults();
  return runNpmScript("test:raw", { allowFailure: true });
})();

if (hasResults()) {
  const reportCode = runNpmScript("report:generate", { allowFailure: true });
  if (reportCode !== 0) {
    console.error(
      "\nReport generation failed. Existing report (if any) was not intentionally removed by this workflow.\n"
    );
    process.exit(reportCode);
  }
} else {
  console.warn("\nNo allure results found. Keeping existing report unchanged.\n");
}

// Generate Cucumber HTML report
runNpmScript("cucumber:report:generate", { allowFailure: true });

if (hasExistingReport()) {
  runNpmScript("print-report", { allowFailure: true });
  if (shouldOpen) {
    openCucumberReportInBrowser();
    openReportInBrowser(testExitCode);
  } else {
    if (testExitCode !== 0) {
      console.warn("\nTests failed, but report steps were still executed.\n");
    }
    process.exit(testExitCode);
  }
} else {
  console.warn("\nNo generated report found yet at allure-report/index.html\n");
  if (testExitCode !== 0) {
    console.warn("\nTests failed, but report steps were still executed.\n");
  }
  process.exit(testExitCode);
}
