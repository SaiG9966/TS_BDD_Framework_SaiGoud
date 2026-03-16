import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frameworkRoot = path.resolve(__dirname, "../..");
const reportPath = path.join(frameworkRoot, "reports", "html-report", "index.html");

if (!fs.existsSync(reportPath)) {
  console.warn("\n⚠️  Cucumber HTML report not found at:\n  " + reportPath);
  console.warn("   Run 'npm run cucumber:report:generate' first.\n");
  process.exit(1);
}

console.log("\n📂 Opening Cucumber HTML report:\n  " + reportPath + "\n");

const openCmd =
  process.platform === "win32"
    ? `explorer "${reportPath}"`
    : process.platform === "darwin"
      ? `open "${reportPath}"`
      : `xdg-open "${reportPath}"`;

exec(openCmd, { shell: true }, (err) => {
  if (err) {
    console.error("Failed to open report:", err.message);
    process.exit(1);
  }
});
