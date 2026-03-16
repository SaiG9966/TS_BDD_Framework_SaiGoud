# Troubleshooting Guide

This guide helps you resolve common issues that may occur during your presentation.

## 1. Directory Errors (`ENOENT`)
**Error:** `npm error enoent Could not read package.json`
**Cause:** Running commands from the wrong directory.
**Fix:** Always ensure you are inside the `playwright-bdd-framework` folder.
```powershell
cd playwright-bdd-framework
```

## 2. Test Failures
**Error:** `Cucumber-js` fails or steps are undefined.
**Fix:** 
- Check if you edited feature files but didn't generate steps:
  ```powershell
  npm run steps:generate
  ```
- Check if environment variables are set correctly in `.env`.

## 3. Report Generation Issues
**Error:** `allure generate` fails or returns `1`.
**Fix:**
- Ensure Allure is installed on your system if `npm install` didn't include it globally.
- Clean the results and retry:
  ```powershell
  Remove-Item -Recurse -Force allure-results
  npm run test:report
  ```

## 4. Playwright Browser Issues
**Error:** `Executable not found`.
**Fix:** Install browsers:
```powershell
npx playwright install
```

## 6. Hanging Report Process
**Problem:** The terminal hangs after running `npm run test:report` and says "Failed to open browser".
**Cause:** The Allure server is running and waiting for you to view the report.
**Fix:** 
- Look for the URL in the terminal (e.g., `http://127.0.0.1:5300`) and open it manually in Chrome.
- To stop the server and return to the prompt, press `Ctrl + C` in the terminal.

## Useful Commands
- `npm run test`: Run all tests.
- `npm run test:report`: Run tests and open the Allure report.
- `npm run steps:generate`: Generate step definitions from features.
- `npm run lint:fix`: Automatically fix code style issues.
