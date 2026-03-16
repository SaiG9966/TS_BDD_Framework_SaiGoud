import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const report = require("multiple-cucumber-html-reporter");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frameworkRoot = path.resolve(__dirname, "../..");

const jsonDir = path.join(frameworkRoot, "reports");
const reportPath = path.join(frameworkRoot, "reports", "html-report");
const jsonFile = path.join(jsonDir, "cucumber-report.json");

if (!fs.existsSync(jsonFile)) {
  console.warn("\n⚠️  No cucumber-report.json found at:\n  " + jsonFile);
  console.warn("   Run tests first to generate results.\n");
  process.exit(0);
}

const browser = process.env.BROWSER || "chromium";
const platformMap = { win32: "windows", darwin: "mac", linux: "linux" };
const platformName = platformMap[os.platform()] ?? os.platform();
const platformVersion = os.release();

report.generate({
  jsonDir,
  reportPath,
  metadata: {
    browser: {
      name: browser,
      version: "latest",
    },
    device: "Local test machine",
    platform: {
      name: platformName,
      version: platformVersion,
    },
  },
  customData: {
    title: "Run Info",
    data: [
      { label: "Project", value: "HYR Tutorials Automation" },
      { label: "Release", value: "1.0.0" },
      { label: "Generated", value: new Date().toLocaleString() },
    ],
  },
});

const htmlReport = path.join(reportPath, "index.html");
console.log("\n✅ Cucumber HTML report generated:");
console.log("  " + htmlReport + "\n");
