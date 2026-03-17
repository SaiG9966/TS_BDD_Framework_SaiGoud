# Playwright + Cucumber BDD Framework (TypeScript)

Automation framework using Playwright + Cucumber + TypeScript with:

- Environment-driven runtime config (`zod` validation)
- Shared browser per run + fresh context/page per scenario
- Allure reporting + Cucumber HTML reporting
- Step definition generation and quality checks

---

## Quick Start

1. Bootstrap project

```bash
npm run setup
```

2. Create or verify local env file

```powershell
Copy-Item .env.example .env
```

3. Run tests

```bash
npm run test
```

4. Generate reports

```bash
npm run report
npm run cucumber:report:generate
```

---

## Important Commands

```bash
npm run test
npm run bdd
npm run test:one -- --tag @smoke
npm run test:one -- --file src/tests/features/<filename>.feature
npm run steps:check
npm run steps:generate -- --feature src/tests/features/<filename>.feature
npm run report:generate
npm run report:open
npm run test:report
```

---

## Jenkins CI/CD (Direct Job Execution)

Use the root pipeline file [../Jenkinsfile](../Jenkinsfile) for Jenkins integration.

### Pipeline stages

1. Checkout
2. Tooling check (Node/npm/Java)
3. Setup (`npm run setup`)
4. Test execution (parameterized script)
5. Report generation (non-blocking)
6. Artifact archive

### Run from Jenkins UI

1. Create a **Pipeline** job
2. Select **Pipeline script from SCM**
3. Use Git repo URL and `main` branch
4. Set **Script Path** to `Jenkinsfile`
5. Click **Build with Parameters**

### Parameters

- `TEST_COMMAND`: choose test profile (`test`, `test:smoke`, `test:regression`, etc.)
- `EXTRA_ARGS`: optional args passed after `--`
- `RUN_SETUP`: install dependencies + Playwright browsers before run
- `GENERATE_REPORTS`: attempt `report:generate` and `cucumber:report:generate`

### Notes

- Java 11+ is needed for Allure HTML generation
- `npm run setup` is already cross-platform and suitable for Jenkins agents
- All artifacts are archived from `allure-results`, `allure-report`, `reports`, and `test-results`

---

## Environment

Set values in `.env` only (keep `.env.example` generic):

- Execution: `BROWSER`, `HEADLESS`, `PARALLEL`, `RETRY`, `TAGS`
- URLs: `BASE_URL`, `LOGIN_URL`, `FEATURE_PATH`, `BASIC_CONTROLS_URL`, `NOP_COMMERCE_URL`
- Credentials: `APP_USERNAME`, `APP_PASSWORD`
- Diagnostics: `TRACE`, `RECORD_VIDEO`, `SCREENSHOT_ON_FAILURE`, `ATTACH_SCREENSHOTS`, `HIGHLIGHT_ELEMENTS`

Additional variables ending with `_URL` are auto-mapped into `runtimeConfig.urls` in camelCase.

---

## Add a New Test

1. Add scenario in `src/tests/features/`
2. Generate step skeletons (`steps:generate`) or add steps manually in `src/tests/stepDefinitions/`
3. Reuse/create page methods in `src/pages/`
4. Validate and run:

```bash
npm run steps:check
npm run test
```

---

## Current Example Included

- `src/tests/features/<filename>.feature`
- `src/tests/stepDefinitions/<filename>StepDef.ts`
- `src/pages/<filename>Page.ts`

---

For a quick user guide, see [README.users.md](README.users.md).

---

## Full Detailed Documentation (Legacy + Extended Notes)

> Note: the sections above are the current source of truth for setup and execution. The legacy notes below are retained for extended explanation and may include historical references.

## Table of Contents

1. [What This Framework Does](#1-what-this-framework-does)
2. [Prerequisites](#2-prerequisites)
3. [One-Line Setup](#3-one-line-setup)
4. [Manual Setup (Alternative)](#4-manual-setup-alternative)
5. [Running Tests](#5-running-tests)
6. [Generating and Viewing Reports](#6-generating-and-viewing-reports)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Full Project Structure](#8-full-project-structure)
9. [File-by-File Explanation](#9-file-by-file-explanation)
   - [src/config/cucumber.cjs](#srcconfiguicumbercjs)
   - [src/config/runtimeConfig.ts](#srcconfigruntimeconfigts)
   - [src/tests/support/customWorld.ts](#srctestssupportcustomworldts)
   - [src/tests/hooks/hooks.ts](#srctestshookshooksts)
  - [src/tests/features/<filename>.feature](#srctestsfeaturesfilenamefeature)
  - [src/tests/stepDefinitions/<filename>StepDef.ts](#srctestsstepDefinitionsfilenamestepdefts)
  - [src/tests/stepDefinitions/step/<filename>Steps.ts](#srctestsstepDefinitionsstepfilenamestepsts)
  - [src/pages/<filename>Page.ts](#srcpagesfilenamepagets)
  - [src/pages/<filename>ModulePage.ts](#srcpagesfilenamemodulepagets)
   - [src/utils/playwrightActions.ts](#srcutilsplaywrightactionsts)
   - [src/utils/playwrightAssertions.ts](#srcutilsplaywrightassertionsts)
   - [src/factories/dataFactory.ts](#srcfactoriesdatafactoryts)
   - [src/utils/highlight.ts](#srcutilshighlightts)
   - [src/utils/runReportWorkflow.js](#srcutilsrunreportworkflowjs)
   - [src/utils/showReportPath.js](#srcutilsshowreportpathjs)
   - [src/utils/checkSteps.js](#srcutilscheckstepsjs)
   - [src/utils/retryReport.js](#srcutilsretryreportjs)
   - [src/utils/reportGenerator.js](#srcutilsreportgeneratorjs)
   - [.env.example](#envexample)
   - [.eslintrc.json + .prettierrc](#eslintrcjson--prettierrc)
   - [.github/workflows/test.yml](#githubworkflowstestyml)
   - [tsconfig.json](#tsconfigjson)
   - [package.json (framework)](#packagejson-framework)
   - [package.json (root)](#packagejson-root)
   - [scripts/setup.js](#scriptssetupjs)
10. [How to Add a New Feature/Test](#10-how-to-add-a-new-featuretest)
11. [Tag Strategy](#11-tag-strategy)
12. [Linting and Formatting](#12-linting-and-formatting)
13. [CI/CD Pipeline (GitHub Actions)](#13-cicd-pipeline-github-actions)
14. [How to Run on Another PC](#14-how-to-run-on-another-pc)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. What This Framework Does

This framework allows you to write automated UI tests in plain English using **Gherkin syntax** (Given / When / Then) that Cucumber understands, while **Playwright** drives the actual browser. Results are collected and turned into an **Allure HTML report** with screenshots attached on failures.

Key qualities:

- **No hardcoded values** — browser, URLs, credentials, and timeouts all come from environment variables with safe defaults
- **Env validation at startup** — invalid `.env` values fail immediately with a clear error message (powered by `zod`)
- **One shared browser per run** — a single browser process is reused across scenarios for speed
- **Fresh browser context and page per scenario** — each test is isolated
- **Screenshot on failure** — automatically attached to the Allure report
- **Optional trace recording** — saves a Playwright trace zip per scenario for debugging
- **Optional element highlighting** — draws a red border around elements during interaction (useful for demos)
- **Parallel and retry support** — configurable without code changes
- **Generic Playwright action methods** — reusable `click`, `fillText`, `check`, `select`, `hover`, `uploadFile` etc. shared across all page objects
- **Built-in assertion helpers** — `expectVisible`, `expectText`, `expectUrlContains`, `expectChecked` and more, usable from any page object
- **Random test data factory** — generate realistic names, emails, passwords, addresses via `TestDataFactory`
- **Named tag run profiles** — `npm run test:smoke`, `test:regression`, `test:wip`, `test:flaky`, `test:api`
- **Step-definition quality guard** — detects duplicate, undefined, and unused steps before a run
- **Retry/rerun summary report** — shows which scenarios were retried and their final outcome
- **ESLint + Prettier** — enforced code style across all TypeScript and JavaScript files
- **GitHub Actions CI pipeline** — full automated pipeline with test run, Allure upload, and artifact storage

---

## 2. Prerequisites

Install these tools on any machine before using the framework:

| Tool | Version | Purpose | Download |
|---|---|---|---|
| **Node.js** | 18 LTS or newer | Runs the framework | https://nodejs.org |
| **Java** | 11 or newer | Required by Allure CLI to generate HTML reports | https://adoptium.net |
| **Git** | Any | To clone the repository | https://git-scm.com |

Verify they are installed by running:

```bash
node -v
java -version
git --version
```

---

## 3. One-Line Setup

After cloning the repository, run this single command from the **repository root**:

```bash
npm run setup
```

This command automatically:

1. Checks if Java is available (warns if missing)
2. Installs all framework npm dependencies
3. Downloads Playwright browsers (Chromium, Firefox, WebKit)
4. Creates `playwright-bdd-framework/.env` from `.env.example` if not already present

You will see output like:

```
Java detected (required for Allure report generation).

=== Install framework dependencies ===
...
=== Install Playwright browsers ===
...
✅ Setup completed.
Run tests with: npm run test
Run report with: npm run report
```

---

## 4. Manual Setup (Alternative)

If you prefer to set up step by step:

**Step 1 — Install root dependencies**

```bash
npm install
```

**Step 2 — Install framework dependencies**

```bash
cd playwright-bdd-framework
npm install
```

**Step 3 — Install Playwright browsers**

```bash
npx playwright install
```

**Step 4 — Create your local environment file**

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

**Step 5 — Edit `.env` if you need custom values**

Open `playwright-bdd-framework/.env` and adjust any variable (see [Section 7](#7-environment-variables-reference)).

---

## 5. Running Tests

All commands below work from either the **repository root** or the `playwright-bdd-framework` folder.

> Every command prints the framework banner in terminal.

**Run all tests (headless, default settings):**

```bash
npm run test
```

**Run tests with browser visible:**

```bash
# macOS / Linux
HEADLESS=false npm run test

# Windows PowerShell
$env:HEADLESS="false"; npm run test
```

**Run only tests with a specific tag:**

```bash
# macOS / Linux
TAGS='@registration' npm run test

# Windows PowerShell
$env:TAGS="@registration"; npm run test
```

**Run tests in parallel (e.g., 2 workers):**

```bash
# macOS / Linux
PARALLEL=2 npm run test

# Windows PowerShell
$env:PARALLEL="2"; npm run test
```

**Run with automatic retries on failure:**

```bash
# macOS / Linux
RETRY=2 npm run test

# Windows PowerShell
$env:RETRY="2"; npm run test
```

**Run with a different browser:**

```bash
# macOS / Linux
BROWSER=firefox npm run test

# Windows PowerShell
$env:BROWSER="firefox"; npm run test
```

**Run with slow motion (e.g., 300ms between actions, useful for demos):**

```bash
# macOS / Linux
HEADLESS=false SLOW_MO=300 HIGHLIGHT_ELEMENTS=true npm run test
```

**Run only one test scope (by tag or by file):**

```bash
# by tag
npm run test:one -- --tag @registration

# by feature file path
npm run test:one -- --file src/tests/features/<filename>.feature

# by feature file name only (auto-searches under src/tests/features)
npm run test:one -- --file <filename>.feature
```

**Run named tag profiles (no env var needed):**

```bash
npm run test:smoke       # runs only @smoke tagged scenarios
npm run test:regression  # runs only @regression tagged scenarios
npm run test:wip         # runs only @wip (work in progress) tagged scenarios
npm run test:flaky       # runs only @flaky tagged scenarios with RETRY=3 automatically
npm run test:api         # runs only @api tagged scenarios
```

**Check step definitions before running:**

```bash
npm run steps:check
```
Detects duplicate, undefined, and unused step definitions — run this before committing new tests.

**View retry/rerun summary after tests:**

```bash
npm run test:retry-report
```
Prints how many scenarios were retried, how many attempts each took, and the final outcome.

### Auto-generate step definitions from a feature file (no copy/paste)

You can now generate step-definition skeletons directly from a `.feature` file.

```bash
npm run steps:generate -- --feature src/tests/features/<filename>.feature
```

Optional custom output file:

```bash
npm run steps:generate -- --feature src/tests/features/<filename>.feature --out src/tests/stepDefinitions/<filename>AutoSteps.ts
```

If output file already exists, only missing steps are appended.

Overwrite full step-definition file:

```bash
npm run steps:generate -- --feature src/tests/features/<filename>.feature --out src/tests/stepDefinitions/<filename>AutoSteps.ts --force
```

---

## 6. Generating and Viewing Reports

**Generate Allure report from existing results:**

```bash
npm run report
```

**Run tests and generate report (keeps report even if tests fail):**

```bash
npm run test:report:no-open
```

**Run tests, generate report, and open it in browser automatically:**

```bash
npm run test:report
```

**Open a previously generated report:**

```bash
npm run open-report
```

The generated report is always saved at:

```
playwright-bdd-framework/allure-report/index.html
```

> **Note:** Allure report generation requires Java 11+. If you see an error, install Java and reopen your terminal.

---

## 7. Environment Variables Reference

All variables are set in `playwright-bdd-framework/.env`. Defaults are pre-filled from `.env.example`.

### Browser & Execution

| Variable | What It Controls | Default | Accepted Values |
|---|---|---|---|
| `BROWSER` | Which browser engine to use | `chromium` | `chromium`, `firefox`, `webkit` |
| `HEADLESS` | Run browser without a visible window | `true` | `true`, `false` |
| `SLOW_MO` | Millisecond delay between every Playwright action | `0` | Any positive integer |
| `HIGHLIGHT_ELEMENTS` | Draw red border on interacted elements | `false` | `true`, `false` |
| `PARALLEL` | Number of Cucumber parallel workers | `0` (sequential) | Any integer ≥ 1 |
| `RETRY` | Number of times to retry a failed scenario | `0` | Any integer ≥ 1 |
| `TAGS` | Cucumber tag filter expression | _(empty = run all)_ | `@tagName`, `@a and @b`, `not @slow` |

### Timeouts

| Variable | What It Controls | Default |
|---|---|---|
| `DEFAULT_TIMEOUT_MS` | Maximum time allowed for each Cucumber step | `60000` (60 sec) |
| `ACTION_TIMEOUT_MS` | Maximum time Playwright waits for any element action | `10000` (10 sec) |
| `NAVIGATION_TIMEOUT_MS` | Maximum time for page navigation | `30000` (30 sec) |

### URLs & Credentials

| Variable | What It Controls | Default |
|---|---|---|
| `BASE_URL` | Optional base URL prefix for all relative navigations | _(empty)_ |
| `LOGIN_URL` | Full URL of the login page | OrangeHRM demo URL |
| `BASIC_CONTROLS_URL` | Full URL of the form controls page | HYR Tutorials page |
| `APP_USERNAME` | Username used when logging in | `Admin` |
| `APP_PASSWORD` | Password used when logging in | `admin123` |

### Reporting & Debugging

| Variable | What It Controls | Default |
|---|---|---|
| `ALLURE_RESULTS_DIR` | Folder where Cucumber writes raw Allure JSON results | `allure-results` |
| `SCREENSHOT_ON_FAILURE` | Attach a full-page screenshot to report on failure | `true` |
| `TRACE` | Record a Playwright trace zip per scenario | `false` |

---

## 8. Full Project Structure

```
Typescript_framework/                    ← Repository root
│
├── package.json                         ← Root scripts (test, report, setup, lint)
├── scripts/
│   └── setup.js                         ← One-line bootstrap script
│
└── .github/
    └── workflows/
        └── test.yml                     ← GitHub Actions CI pipeline

playwright-bdd-framework/               ← Main framework folder
    │
    ├── package.json                     ← Framework dependencies and npm scripts
    ├── tsconfig.json                    ← TypeScript compiler settings
    ├── .env.example                     ← Template for environment variables
    ├── .env                             ← Your local config (not committed to git)
    ├── .eslintrc.json                   ← ESLint rules for TypeScript files
    ├── .prettierrc                      ← Prettier formatting config
    ├── README.md                        ← This file
    │
    ├── allure-results/                  ← Raw test result JSON files (auto-generated)
    ├── allure-report/                   ← Generated HTML report (auto-generated)
    │
    └── src/
        ├── config/
        │   ├── cucumber.cjs             ← Cucumber runner configuration
        │   └── runtimeConfig.ts         ← Zod-validated env-driven runtime settings
        │
        ├── factories/
        │   └── dataFactory.ts           ← Random test data generator (faker-based)
        │
        ├── tests/
        │   ├── support/
        │   │   └── customWorld.ts       ← Shared Cucumber world (browser/page/data)
        │   │
        │   ├── hooks/
        │   │   └── hooks.ts             ← BeforeAll/Before/After/AfterAll lifecycle
        │   │
        │   ├── features/
        │   │   └── <filename>.feature ← Gherkin test scenarios
        │   │
        │   └── stepDefinitions/
        │       ├── <filename>StepDef.ts  ← Step bindings for one module
        │       └── step/
        │           └── <filename>Steps.ts    ← Step bindings for grouped flow
        │
        ├── pages/
        │   ├── <filename>/
        │   │   └── <filename>Page.ts         ← Page object for one module flow
        │   └── <filename>ModulePage.ts     ← Page object for another module flow
        │
        └── utils/
            ├── playwrightActions.ts     ← Base class: generic browser action methods
            ├── playwrightAssertions.ts  ← Assertion helpers (expectVisible, expectText…)
            ├── highlight.ts             ← Optional visual element highlighter
            ├── runReportWorkflow.js     ← Resilient test + report runner
            ├── showReportPath.js        ← Prints report location after run
            ├── checkSteps.js            ← Step definition quality guard
            ├── retryReport.js           ← Retry/rerun summary reporter
            └── reportGenerator.js      ← HTML reporter (multiple-cucumber)
```

---

## 9. File-by-File Explanation

---

### `src/config/cucumber.cjs`

**What it is:** The main configuration file that Cucumber reads when you run `npm run test`.

**Why `.cjs`:** Cucumber's config loader requires CommonJS format. The rest of the project uses ES Modules (TypeScript), but this config file must be CommonJS.

**What each setting does:**

```javascript
require("dotenv").config();           // Loads .env file into process.env before anything else
```

```javascript
loader: ["ts-node/esm"]              // Tells Cucumber to transpile TypeScript files using ts-node with ESM support
```

```javascript
import: [
  "src/tests/support/**/*.ts",       // Load customWorld.ts first (defines the World class)
  "src/tests/stepDefinitions/**/*.ts", // Load all step definition files
  "src/tests/hooks/**/*.ts"          // Load hooks (Before, After, BeforeAll, AfterAll)
]
```

```javascript
paths: ["src/tests/features/**/*.feature"]  // Where to find your Gherkin scenario files
```

```javascript
format: [
  "progress",                        // Print a dot or F for each step in terminal
  "allure-cucumberjs/reporter"       // Also write Allure-compatible JSON result files
]
```

```javascript
formatOptions: {
  resultsDir: process.env.ALLURE_RESULTS_DIR || "allure-results"  // Where to write JSON results
}
```

```javascript
tags: process.env.TAGS              // Filter which scenarios run (e.g., @registration)
parallel: Number(process.env.PARALLEL || 0)  // Run scenarios in parallel workers
retry: Number(process.env.RETRY || 0)        // Re-run failed scenarios N times
```

---

### `src/config/runtimeConfig.ts`

**What it is:** A single TypeScript file that validates all environment variables with `zod` and exports them as a strongly-typed object. Every other file that needs configuration imports from here — nothing reads `process.env` directly anywhere else.

**Why this matters:** If an env variable is missing, wrong type, or has an invalid value, the run **fails immediately at startup** with a clear error message pointing to the exact variable — rather than failing silently mid-test.

**Key parts:**

```typescript
const envSchema = z.object({
  BROWSER: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
  HEADLESS: z.string().default("true"),
  LOGIN_URL: z.string().url(),
  ...
});
// Defines the shape and rules for every allowed env variable
// z.enum() restricts to valid values; z.string().url() requires a valid URL
```

```typescript
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  parsed.error.issues.forEach(issue =>
    console.error(`  ❌ ${issue.path.join(".")}: ${issue.message}`)
  );
  process.exit(1);   // Fail immediately — never start the browser with bad config
}
```

```typescript
export const runtimeConfig: RuntimeConfig = {
  browser: parsed.data.BROWSER,
  headless: parsed.data.HEADLESS === "true",
  loginUrl: parsed.data.LOGIN_URL,
  ...
};
```

Every page object and hook imports this object to know what URLs, timeouts, and options to use.

---

### `src/tests/support/customWorld.ts`

**What it is:** The Cucumber "World" — a class instance that is created fresh for each scenario and shared between all steps within that scenario.

**Why it exists:** By default, Cucumber's world is a plain empty object. By replacing it with `CustomWorld`, every step gets typed access to `this.page`, `this.runtime`, and `this.formData` without any casting or extra lookups.

**What it contains:**

```typescript
page: Page           // The Playwright page object for the current scenario
context: BrowserContext  // The browser context (used by hooks to close it after)
runtime: RuntimeConfig   // The full runtime config object
formData: Record<string, unknown>  // A scratch space to store form values during a scenario
                                   // (e.g., store firstName in a When step, read it in a Then step)
```

```typescript
setWorldConstructor(CustomWorld)
// Registers this class with Cucumber so it uses CustomWorld instead of the default
```

---

### `src/tests/hooks/hooks.ts`

**What it is:** Lifecycle hooks that Cucumber calls automatically around each scenario and the entire test run.

**Execution order:**

```
BeforeAll  → runs once before any scenario
  Before   → runs before each individual scenario
    [scenario steps execute]
  After    → runs after each individual scenario
AfterAll   → runs once after all scenarios finish
```

**`BeforeAll`** — Launches one shared browser for the entire run:

```typescript
sharedBrowser = await launcher.launch({
  headless: runtimeConfig.headless,   // From .env or default (true)
  slowMo: runtimeConfig.slowMo        // Optional delay between actions
});
```

Launching once instead of once per scenario significantly reduces total run time.

**`Before`** — Creates a fresh browser context and page for each scenario:

```typescript
this.context = await sharedBrowser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1366, height: 768 }
});
this.page = await this.context.newPage();
this.formData = {};   // Reset form data storage for this scenario
```

Each scenario gets its own cookies, local storage, and tab — completely isolated.

**`After`** — Runs cleanup after each scenario:

```typescript
// If scenario FAILED and screenshot is enabled, attach a full-page screenshot to the Allure report
if (runtimeConfig.screenshotOnFailure && result?.status === Status.FAILED) {
  const screenshot = await this.page.screenshot({ fullPage: true });
  await this.attach(screenshot, "image/png");
}

// If tracing is enabled, save the trace zip file for debugging
if (runtimeConfig.trace) {
  await this.context.tracing.stop({ path: `test-results/${scenarioName}.zip` });
}

await this.context?.close();  // Close this scenario's browser context
```

**`AfterAll`** — Closes the shared browser after everything is done:

```typescript
await sharedBrowser?.close();
```

---

### `src/tests/features/<filename>.feature`

**What it is:** A Gherkin `.feature` file — this is where test scenarios are written in plain English. Non-technical stakeholders can read and write these.

**Structure explained:**

```gherkin
@registration
Feature: User Registration Form
```
`@registration` is a **tag**. Running `TAGS=@registration npm run test` will execute only this feature.

```gherkin
  As a user
  I want to fill the registration form
  So that I can submit my details successfully
```
The "As a / I want / So that" block is a **user story description** — it documents the purpose of the feature.

```gherkin
  Scenario: Fill Complete Registration Form
```
A scenario is a single test case. Each scenario runs independently with a fresh browser context.

```gherkin
    Given user opens the registration form
    When user enters first name "FirstName"
    And user enters last name "LastName"
    And user selects gender "Male"
    And user selects languages
      | English |
      | Hindi   |
    And user enters email "user@example.com"
    And user enters password "Test@123"
    Then all user details should be filled successfully
    And user should click on Register Button
```

- **Given** = precondition (set up the page)
- **When** = action (user interaction)
- **Then** = assertion (verify result)
- **And** = continuation of the previous keyword
- The `| English | Hindi |` block is a **DataTable** — a list passed into the step

---

### `src/tests/stepDefinitions/<filename>StepDef.ts`

**What it is:** The code file that connects Gherkin steps to actual Playwright automation. Each `Given`, `When`, `Then` function here matches a step sentence from the `.feature` file.

**Key patterns:**

```typescript
Given("user opens the registration form", async function (this: CustomWorld) {
  basicControlsPage = new basicControls_Page(this.page, this.runtime);
  await basicControlsPage.navigate();
});
```
Creates a page object instance using the scenario's page and runtime config, then navigates.

```typescript
When("user enters first name {string}", async function (this: CustomWorld, firstName: string) {
  this.formData.firstName = firstName;       // Store value for use in Then step
  await basicControlsPage.enterFirstname(firstName);
});
```
`{string}` is a **Cucumber expression** — it captures the quoted value from the feature file (e.g., `"FirstName"`) and passes it as `firstName`.

```typescript
Then("all user details should be filled successfully", async function (this: CustomWorld) {
  const firstNameValue = await basicControlsPage.getFirstnameValue();
  expect(firstNameValue).to.equal(expectedFirstName);
  // ... (checks all stored values against what's actually in the form fields)
});
```
Reads back the values stored in `this.formData` during `When` steps, then reads the actual page field values, and asserts they match using Chai's `expect`.

---

### `src/tests/stepDefinitions/step/<filename>Steps.ts`

**What it is:** Step definitions for the OrangeHRM login flow. Kept in a `step/` subfolder to allow logical grouping as the framework grows.

**How credentials are handled:**

```typescript
When("user enters valid username and password", async function (this: CustomWorld) {
  await loginPage.enterUsername(this.runtime.username);   // From APP_USERNAME in .env
  await loginPage.enterPassword(this.runtime.password);   // From APP_PASSWORD in .env
});
```

Credentials are never hardcoded. Change `APP_USERNAME` and `APP_PASSWORD` in `.env` to test with different accounts.

---

### `src/pages/<filename>Page.ts`

**What it is:** A Page Object for the OrangeHRM login page. Page objects contain all the selectors and actions for a specific page, so step definitions stay clean and readable.

**Structure:**

```typescript
// Selectors — CSS strings that identify elements
usernameInput = "input[name='username']";
passwordInput = "input[name='password']";
loginButton   = "button[type='submit']";
dashboardHeader = "h6:has-text('Dashboard')";
```

```typescript
async navigate() {
  await this.page.goto(this.runtime.loginUrl, { waitUntil: "domcontentloaded" });
  await this.page.waitForSelector(this.usernameInput, { state: "visible" });
  // waitUntil "domcontentloaded" is faster than "networkidle" — loads as soon as HTML is parsed
}
```

```typescript
async enterUsername(username: string) {
  const field = this.page.locator(this.usernameInput);
  await field.waitFor({ state: "visible" });
  await highlightElement(this.page, this.usernameInput, this.runtime.highlightElements);
  await field.fill("");        // Clear any existing value
  await field.fill(username);  // Fill new value — faster than .type() which sends keystrokes
}
```

```typescript
async verifyDashboard() {
  await this.page.waitForSelector(this.dashboardHeader, { timeout: 20000 });
  // Waits up to 20 seconds for the Dashboard heading to appear after login
}
```

---

### `src/pages/<filename>ModulePage.ts`

**What it is:** A Page Object for another module flow. Follows the same structure as `<filename>Page.ts`.

**Notable additions:**

```typescript
maleGenderInput   = "input[id='malerb']";
femaleGenderInput = "input[id='femalerb']";

async selectGender(gender: string) {
  const normalizedGender = gender.toLowerCase().trim();
  const selector = normalizedGender === "female" ? this.femaleGenderInput : this.maleGenderInput;
  await this.page.locator(selector).check();
}
```
Gender selection is normalized to lowercase so `"Male"`, `"male"`, and `"MALE"` all work.

```typescript
async selectLanguages(languages: string[]) {
  for (const language of languages) {
    if (language.toLowerCase() === "english") await this.page.locator(this.englishLanguagesInput).check();
    if (language.toLowerCase() === "hindi")   await this.page.locator(this.hindiLanguagesInput).check();
  }
}
```
Accepts an array of language names from the DataTable and checks each matching checkbox.

---

### `src/utils/highlight.ts`

**What it is:** A utility function that draws a red border and yellow background on any element during a test. Used only when `HIGHLIGHT_ELEMENTS=true`.

```typescript
export async function highlightElement(page: Page, locator: string, enabled = false) {
  if (!enabled) return;    // Returns immediately unless explicitly enabled — zero performance cost
  await page.locator(locator).evaluate((el: HTMLElement) => {
    el.style.border = "3px solid red";
    el.style.backgroundColor = "yellow";
  });
}
```

**When to enable it:** Set `HEADLESS=false HIGHLIGHT_ELEMENTS=true` when recording demos or debugging which element is being interacted with.

---

### `src/utils/runReportWorkflow.js`

**What it is:** The core script behind `npm run test:report` and `npm run test:report:no-open`. Unlike a simple `&&` chain in package.json, this Node script **always generates the report even if tests fail**.

**Logic flow:**

```
1. Run tests (allows failure, captures exit code)
2. If allure-results folder has files → generate Allure HTML report
3. If allure-report/index.html exists → print report path
4. If --open flag passed → open report in browser
5. Exit with the original test exit code (so CI pipelines detect failures correctly)
```

The key difference vs `npm run test && npm run report`:  
`&&` stops on failure. This script continues regardless, so your report is always fresh.

---

### `src/utils/showReportPath.js`

**What it is:** A small utility that prints the absolute file path to the Allure report after generation.

```javascript
const frameworkRoot = path.resolve(__dirname, "../..");
const reportPath = path.resolve(frameworkRoot, "allure-report/index.html");
console.log(" Allure Report Location:");
console.log(reportPath);
```

Uses `__dirname` (resolved via `import.meta.url`) to always produce the correct path regardless of which directory you run `npm` from.

**Important terminal output note:** this file also prints a footer line with the framework owner name after report generation. If you see `Framework by Thirumandas Saiteja Goud` in the terminal, it is coming from this script.

---

### `src/utils/playwrightActions.ts`

**What it is:** The base class for all page objects. Instead of duplicating `this.page.locator(...).click()` across every page file, all common browser actions live here and are inherited.

**All page objects extend this class:**

```
PlaywrightActions  ← raw browser interactions
    └── PlaywrightAssertions  ← adds typed expect wrappers
            └── LoginPage / BasicControlsPage / …  ← your page objects
```

**Available action methods:**

| Method | What it does |
|---|---|
| `goto(url)` | Navigate to a URL, waits for `domcontentloaded` |
| `waitForVisible(selector)` | Wait until an element is visible |
| `click(selector)` | Click an element |
| `fillText(selector, text)` | Clear field and fill with text |
| `typeText(selector, text)` | Type character-by-character (triggers keyboard events) |
| `press(selector, key)` | Press a keyboard key on a focused element |
| `check(selector)` | Check a checkbox or radio button |
| `uncheck(selector)` | Uncheck a checkbox |
| `select(selector, value)` | Select a `<select>` dropdown option by value |
| `hover(selector)` | Move mouse over an element |
| `scrollIntoView(selector)` | Scroll element into the viewport |
| `uploadFile(selector, path)` | Attach a file via a file input |
| `getText(selector)` | Return the visible text content |
| `getInputValue(selector)` | Return the current value of an input |
| `isChecked(selector)` | Return whether a checkbox is checked |
| `isVisible(selector)` | Return whether an element is visible |
| `screenshot(name)` | Take and save a screenshot |

All methods use `this.runtime.actionTimeoutMs` as their element wait timeout.

---

### `src/utils/playwrightAssertions.ts`

**What it is:** Extends `PlaywrightActions` with typed assertion methods backed by Playwright’s `expect` API. All page objects inherit both the action and assertion layers.

**Why it exists:** Keeps assertions strongly typed and timeout-aware. Rather than calling `expect(await this.page.locator(selector).textContent()).toBe(…)` in every step, you call `await this.expectText(selector, “hello”)` instead.

**Available assertion methods:**

| Method | Asserts that |
|---|---|
| `expectVisible(selector)` | Element is visible |
| `expectNotVisible(selector)` | Element is hidden or absent |
| `expectText(selector, text)` | Element’s text equals `text` exactly |
| `expectContainsText(selector, text)` | Element’s text contains `text` |
| `expectInputValue(selector, value)` | Input field value equals `value` |
| `expectChecked(selector)` | Checkbox/radio is checked |
| `expectNotChecked(selector)` | Checkbox/radio is unchecked |
| `expectEnabled(selector)` | Element is enabled (not disabled) |
| `expectDisabled(selector)` | Element is disabled |
| `expectAttribute(selector, attr, value)` | Attribute equals `value` exactly |
| `expectAttributeContains(selector, attr, value)` | Attribute contains `value` |
| `expectCount(selector, count)` | Number of matching elements equals `count` |
| `expectUrlContains(text)` | Current URL contains `text` |
| `expectUrl(url)` | Current URL equals `url` exactly |
| `expectTitle(title)` | Page title equals `title` |

**Usage in a page object:**

```typescript
import { PlaywrightAssertions } from "../../utils/playwrightAssertions.ts";

export class LoginPage extends PlaywrightAssertions {
  dashboardHeader = "h6:has-text('Dashboard')";

  async verifyDashboard() {
    await this.expectVisible(this.dashboardHeader);
    await this.expectUrlContains("/dashboard");
  }
}
```

---

### `src/factories/dataFactory.ts`

**What it is:** A static test data factory powered by `@faker-js/faker`. Use it anywhere you need realistic random data without hardcoding strings.

**Why it matters:** Hardcoded test data like `"FirstName"` or `"user@example.com"` can cause flakiness if the app remembers previous entries or blocks duplicates. Random data each run avoids these collisions.

**Individual field generators:**

```typescript
import { TestDataFactory as F } from "../../factories/dataFactory.ts";

F.firstName()            // "Liam"
F.lastName()             // "Henderson"
F.email()                // "liam.xyz123@example.com"
F.email("qa")            // "qa.abc456@example.com"  (custom prefix)
F.password(16)           // "Xk9!mTqZpR2#vYwL"  (16 chars, default 12)
F.phone()                // "+1 555-382-1947"
F.username()             // "liam_henderson92"
F.street()               // "742 Evergreen Terrace"
F.city()                 // "Springfield"
F.zipCode()              // "62704"
F.country()              // "United States"
F.company()              // "Acme Corp"
F.uuid()                 // "a1b2c3d4-..."
F.number(1, 100)         // 42
F.alphanumeric(8)        // "aB3kQ9Xz"
F.pastDate()             // Date object in the past
F.futureDate()           // Date object in the future
```

**Composite object generators:**

```typescript
const user = F.fullUser();
// {
//   firstName: "Liam",
//   lastName: "Henderson",
//   email: "liam.xyz123@example.com",
//   password: "Xk9!mTqZpR2#",
//   phone: "+1 555-382-1947",
//   username: "liam_henderson92"
// }

const addr = F.address();
// { street: "742 Evergreen Terrace", city: "Springfield", zipCode: "62704", country: "United States" }
```

**Usage in a step definition:**

```typescript
const user = TestDataFactory.fullUser();
this.formData = user;
await registrationPage.enterFirstname(user.firstName);
await registrationPage.enterEmail(user.email);
```

---

### `src/utils/checkSteps.js`

**What it is:** A pre-run quality guard that scans all step definition `.ts` files and `.feature` files for common mistakes.

**What it detects:**

| Check | Severity | Description |
|---|---|---|
| Duplicate step definitions | ❌ Error | Two `.ts` files define the same step text |
| Undefined steps | ❌ Error | Feature file uses a step with no matching definition |
| Unused steps | ⚠️ Warning | Step is defined in `.ts` but never used in any `.feature` |

**Run it:**

```bash
npm run steps:check
```

**Example outputs:**

```
✔️ All step definitions are consistent with feature files.
```

```
❌ Duplicate step definitions found:
  "user opens the registration form" is defined 2 times

❌ Undefined steps (used in features but no matching definition):
  "user clicks confirm button"

⚠️  Unused step definitions (defined but never used in features):
  "user presses the back button"
```

The CI pipeline runs `steps:check` automatically before every test run.

---

### `src/utils/retryReport.js`

**What it is:** Post-run reporter that parses `allure-results/*.json` files and summarises which scenarios were retried and what the final outcome was.

**Run it after a test run:**

```bash
npm run test:retry-report
```

**Example output when retries occurred:**

```
🔁 Retry Summary
===============================
Scenario: User logs in with valid credentials
  Attempt 1: failed
  Attempt 2: passed
  Final result: ✅ passed after retry

Scenario: User submits registration form
  Attempt 1: failed
  Attempt 2: failed
  Attempt 3: failed
  Final result: ❌ still failing after 3 attempts
```

**Exit code:** 1 if any scenario is still failing after all retries (so CI detects it).

---

### `src/utils/reportGenerator.js`

**What it is:** An alternative HTML report generator using `multiple-cucumber-html-reporter`. This produces a different style of HTML report from JSON output files in the `reports/` folder.

> This is a separate reporter from Allure. Allure is the primary reporter used by all `npm run report` commands. This file exists for teams that prefer the multiple-cucumber-html-reporter format.

---

### `.eslintrc.json` + `.prettierrc`

**What they are:** Code quality configuration files for ESLint (rules) and Prettier (formatting).

**`.eslintrc.json` — key rules:**

| Rule | Level | What it enforces |
|---|---|---|
| `no-unused-vars` | warn | Flag variables declared but never used |
| `@typescript-eslint/no-explicit-any` | warn | Discourage `any` type usage |
| `@typescript-eslint/consistent-type-imports` | error | Force `import type` for type-only imports |
| `prefer-const` | error | Use `const` when a variable is never reassigned |
| `no-var` | error | Disallow `var` declarations |
| `eqeqeq` | error | Require `===` instead of `==` |

**`.prettierrc` — formatting settings:**

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 110,
  "endOfLine": "lf"
}
```

**Run from anywhere in the repo:**

```bash
npm run lint           # check for rule violations
npm run lint:fix       # auto-fix what ESLint can fix
npm run format         # reformat all TS/JS files
npm run format:check   # check formatting without writing (useful in CI)
```

---

### `.github/workflows/test.yml`

**What it is:** The GitHub Actions CI pipeline definition. Runs automatically on every push or pull request to `main` or `develop`.

**Trigger options:**



```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      browser:
        description: 'Browser to use'
        default: 'chromium'
      tags:
        description: 'Cucumber tag filter'
        default: ''
```

`workflow_dispatch` lets you manually trigger the pipeline from the GitHub Actions UI with a custom browser or tag filter.

**Pipeline steps in order:**

| Step | What it does |
|---|---|
| Checkout | Clone the repository |
| Node.js 20 | Install the correct Node.js version |
| Java 17 | Install Java (required for Allure CLI) |
| `npm ci` | Install all dependencies from lock file |
| Playwright install | Download browser binaries |
| `steps:check` | Validate step definitions before running |
| Run tests | Execute the full suite and generate Allure results |
| `test:retry-report` | Print retry/rerun summary |
| Upload allure-results | Store raw JSON results as a GitHub artifact |
| Upload allure-report | Store generated HTML report as a GitHub artifact |
| Upload test-results | Store trace files as a GitHub artifact |

**Required GitHub Secrets** (set in repo Settings → Secrets and variables → Actions):

| Secret | Used for |
|---|---|
| `APP_USERNAME` | Login username for the test app |
| `APP_PASSWORD` | Login password for the test app |
| `LOGIN_URL` | URL of the login page |
| `BASIC_CONTROLS_URL` | URL of the form controls page |

---

### `.env.example`

**What it is:** A committed template showing all available environment variables with their default values. It is safe to commit because it contains no real secrets.

**Workflow:**

1. `.env.example` is in source control — everyone can see what variables exist
2. Each developer/CI system copies it to `.env` and fills in real values
3. `.env` is **never committed** (add it to `.gitignore`) because it may contain real credentials

---

### `tsconfig.json`

**What it is:** TypeScript compiler configuration.

```jsonc
"target": "ES2022"          // Compile TypeScript down to ES2022 JavaScript
"module": "NodeNext"        // Use Node's native ESM module system
"moduleResolution": "NodeNext"  // Resolve imports the same way Node.js does
"strict": true              // Enable all strict type checks (catches bugs at compile time)
"noEmit": true              // Do not write compiled JS files — ts-node runs TS directly
"allowImportingTsExtensions": true  // Allow importing files with .ts extension in code
"skipLibCheck": true        // Skip type-checking of node_modules (speeds up compilation)
```

---

### `package.json` (framework)

**Location:** `playwright-bdd-framework/package.json`

**Important terminal output note:** if you see `[Framework Owner] Thirumandas Saiteja Goud` before commands such as `npm run test`, `npm run test:report`, or `npm run report`, that text is printed by the `identity` script and the related `pre*` npm hooks (`pretest`, `pretest:report`, `prereport`, etc.). npm runs those hooks automatically before the main script.

**Scripts:**

| Script | What it runs |
|---|---|
| `npm run identity` | Print the framework owner banner in the terminal |
| `npm run test` | Run all Cucumber scenarios |
| `npm run test:raw` | Same as test (the base command used internally) |
| `npm run test:smoke` | Run only `@smoke` tagged scenarios |
| `npm run test:regression` | Run only `@regression` tagged scenarios |
| `npm run test:wip` | Run only `@wip` tagged scenarios |
| `npm run test:flaky` | Run only `@flaky` tagged scenarios with `RETRY=3` |
| `npm run test:api` | Run only `@api` tagged scenarios |
| `npm run test:one` | Run tests filtered by a single tag or file path |
| `npm run report` | Generate Allure report + print path |
| `npm run report:generate` | Generate Allure HTML from allure-results folder |
| `npm run report:open` | Open generated Allure report in browser |
| `npm run open-report` | Alias for report:open |
| `npm run print-report` | Print the report file path to terminal |
| `npm run test:report` | Run tests + generate report + open in browser |
| `npm run test:report:no-open` | Run tests + generate report (no browser open) |
| `npm run steps:check` | Scan for duplicate, undefined, or unused step definitions |
| `npm run test:retry-report` | Parse allure-results and print retry/rerun summary |
| `npm run lint` | Run ESLint on all TypeScript source files |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier on all TS/JS source files |
| `npm run format:check` | Check formatting without writing changes |

---

### `package.json` (root)

**Location:** `Typescript_framework/package.json`

Provides the same commands as the framework package, but runnable from the repo root without `cd`-ing into the subfolder:

| Script | Delegates to |
|---|---|
| `npm run setup` | `scripts/setup.js` |
| `npm run test` | `playwright-bdd-framework` → `npm run test` |
| `npm run test:smoke` | `playwright-bdd-framework` → `npm run test:smoke` |
| `npm run test:regression` | `playwright-bdd-framework` → `npm run test:regression` |
| `npm run test:wip` | `playwright-bdd-framework` → `npm run test:wip` |
| `npm run test:flaky` | `playwright-bdd-framework` → `npm run test:flaky` |
| `npm run test:api` | `playwright-bdd-framework` → `npm run test:api` |
| `npm run report` | `playwright-bdd-framework` → `npm run report` |
| `npm run open-report` | `playwright-bdd-framework` → `npm run open-report` |
| `npm run test:report` | `playwright-bdd-framework` → `npm run test:report` |
| `npm run test:report:no-open` | `playwright-bdd-framework` → `npm run test:report:no-open` |
| `npm run steps:check` | `playwright-bdd-framework` → `npm run steps:check` |
| `npm run test:retry-report` | `playwright-bdd-framework` → `npm run test:retry-report` |
| `npm run lint` | `playwright-bdd-framework` → `npm run lint` |
| `npm run lint:fix` | `playwright-bdd-framework` → `npm run lint:fix` |
| `npm run format` | `playwright-bdd-framework` → `npm run format` |
| `npm run format:check` | `playwright-bdd-framework` → `npm run format:check` |

---

### `scripts/setup.js`

**What it is:** The one-line bootstrap script run by `npm run setup`. Located at the repo root so it can orchestrate both the root and framework layers.

**Steps it performs:**

```javascript
checkJava()
// Runs "java -version" to verify Java is installed
// Prints a warning (but does not stop) if Java is missing
```

```javascript
runNpm(["install"], frameworkRoot, ...)
// Runs "npm install" inside playwright-bdd-framework/
// Installs all dependencies listed in that package.json
```

```javascript
runNpm(["exec", "playwright", "install"], frameworkRoot, ...)
// Runs "npx playwright install" inside the framework
// Downloads Chromium, Firefox, and WebKit browser binaries
```

```javascript
ensureEnvFile()
// Copies .env.example to .env only if .env doesn't already exist
// This means running setup twice will not overwrite your custom .env
```

---

## 10. How to Add a New Feature/Test

Follow these steps whenever you want to automate a new page or flow:

**Step 1 — Create a feature file**

Add a new `.feature` file inside `src/tests/features/`:

```gherkin
@checkout
Feature: Product Checkout

  Scenario: User completes checkout
    Given user is on the product page
    When user adds item to cart
    And user proceeds to checkout
    Then order confirmation is displayed
```

**Step 2 — Create a Page Object**

Add a new file in `src/pages/`, e.g., `src/pages/<filename>Page.ts`. Page objects **extend `PlaywrightAssertions`** to inherit all action and assertion helpers:

```typescript
import { PlaywrightAssertions } from "../utils/playwrightAssertions.ts";
import type { Page } from "@playwright/test";
import type { RuntimeConfig } from "../config/runtimeConfig.ts";

export class <filename>Page extends PlaywrightAssertions {
  constructor(public page: Page, public runtime: RuntimeConfig) {
    super(page, runtime);
  }

  cartButton = "#add-to-cart";
  confirmationHeading = "h1:has-text('Order confirmed')";

  async addToCart() {
    await this.click(this.cartButton);       // inherited from PlaywrightActions
  }

  async verifyOrderConfirmed() {
    await this.expectVisible(this.confirmationHeading);   // inherited from PlaywrightAssertions
  }
}
```

**Step 3 — Create a step definition file**

Add `src/tests/stepDefinitions/checkoutSteps.ts`. Use `TestDataFactory` to avoid hardcoded data:

```typescript
import { Given, When, Then } from "@cucumber/cucumber";
import { <filename>Page } from "../../pages/<filename>Page.ts";
import { TestDataFactory } from "../../factories/dataFactory.ts";
import type { CustomWorld } from "../support/customWorld.ts";

let modulePage: <filename>Page;

Given("user is on the product page", async function (this: CustomWorld) {
  modulePage = new <filename>Page(this.page, this.runtime);
  await modulePage.goto("https://your-app.com/products");  // inherited goto
});

When("user adds item to cart", async function () {
  await modulePage.addToCart();
});

Then("order confirmation is displayed", async function () {
  await modulePage.verifyOrderConfirmed();  // uses expectVisible internally
});

// Example: generate a random user with TestDataFactory
When("user fills in their details", async function (this: CustomWorld) {
  const user = TestDataFactory.fullUser();
  this.formData = user;  // store for later assertions
  await modulePage.fillShippingForm(user);
});
```

**Step 4 — Run the new scenario**

```bash
TAGS=@checkout npm run test
```

**Step 5 — If the URL is environment-specific, add it to runtimeConfig**

In `src/config/runtimeConfig.ts`:

```typescript
checkoutUrl: process.env.CHECKOUT_URL || "https://default-url.com/products"
```

And in `.env.example`:

```
CHECKOUT_URL=https://default-url.com/products
```

---

## 11. Tag Strategy

Cucumber tags (`@tagName`) control which scenarios are included in a run. The framework provides built-in named profiles for the most common tag groups.

### Built-in profiles

| Command | Tag filter | Notes |
|---|---|---|
| `npm run test:smoke` | `@smoke` | Fast sanity check |
| `npm run test:regression` | `@regression` | Full regression suite |
| `npm run test:wip` | `@wip` | In-progress scenarios only |
| `npm run test:flaky` | `@flaky` | Runs with `RETRY=3` automatically |
| `npm run test:api` | `@api` | API-level tests |

### Custom ad-hoc filter

For one-off runs, use the `TAGS` env var directly:

```bash
# Run scenarios with both @smoke AND @login
TAGS="@smoke and @login" npm run test

# Run everything except @slow
TAGS="not @slow" npm run test

# Single tag shortcut
npm run test:one -- --tag @checkout
```

### Tagging conventions

```gherkin
@smoke @registration
Scenario: Fill complete registration form
  ...

@regression @login
Scenario: User logs in with valid credentials
  ...

@wip
Scenario: Incomplete scenario under development
  ...
```

A scenario can have **multiple tags**. Tag expressions (`and`, `or`, `not`) let you combine them at run time without editing feature files.

---

## 12. Linting and Formatting

The framework enforces consistent code style across all TypeScript and JavaScript files using ESLint and Prettier.

### Quick reference

```bash
# Check for ESLint rule violations
npm run lint

# Auto-fix ESLint violations where possible
npm run lint:fix

# Reformat all source files with Prettier
npm run format

# Check formatting without writing (CI-safe)
npm run format:check
```

### ESLint rules enforced

| Rule | Level | Why |
|---|---|---|
| `prefer-const` | error | Prevents accidental reassignment |
| `no-var` | error | Use `let`/`const` only |
| `eqeqeq` | error | Use `===` instead of `==` |
| `consistent-type-imports` | error | `import type` for types keeps the runtime clean |
| `no-unused-vars` | warn | Flag dead code before it accumulates |
| `no-explicit-any` | warn | Encourage proper typing over `any` |

### Prettier settings

| Setting | Value |
|---|---|
| `semi` | `true` — always add semicolons |
| `singleQuote` | `false` — use double quotes |
| `trailingComma` | `es5` — trailing commas where valid in ES5 |
| `tabWidth` | `2` |
| `printWidth` | `110` |
| `endOfLine` | `lf` |

### IDE integration

Install the **ESLint** and **Prettier — Code formatter** VS Code extensions, then set Prettier as the default formatter. Saving a file will auto-format it.

---

## 13. CI/CD Pipeline (GitHub Actions)

The pipeline runs automatically on every push or pull request to `main` or `develop`.

### What the pipeline does

```
push / PR to main or develop
    └─ Checkout code
    └─ Install Node.js 20 + Java 17
    └─ npm ci  (install from lock file)
    └─ playwright install  (download browser binaries)
    └─ npm run steps:check  ← validates step defs first
    └─ npm run test:report:no-open  ← run tests + generate Allure
    └─ npm run test:retry-report  ← print retry summary
    └─ Upload artifacts:
          allure-results/   (raw JSON)
          allure-report/    (HTML report)
          test-results/     (trace zips)
```

### Manual trigger

You can trigger the pipeline manually from **GitHub → Actions → Run workflow** with optional inputs:

- **browser** — `chromium` (default), `firefox`, or `webkit`
- **tags** — Cucumber tag expression (e.g., `@smoke`), leave blank for all

### Required secrets

Add these in **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | What it is |
|---|---|
| `APP_USERNAME` | Login username for the app under test |
| `APP_PASSWORD` | Login password |
| `LOGIN_URL` | Full URL of the login page |
| `BASIC_CONTROLS_URL` | Full URL of the form controls page |

### Downloading artifacts

After a pipeline run completes, go to the workflow run page in GitHub and scroll to the **Artifacts** section. Download `allure-report` and open `index.html` locally to view the full test report.

---

## 14. How to Run on Another PC

Minimum steps on a new machine:

1. Install **Node.js 18+**, **Java 11+**, **Git**
2. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Typescript_framework
   ```
3. Run the one-line setup:
   ```bash
   npm run setup
   ```
4. Run tests:
   ```bash
   cd playwright-bdd-framework
   npm run test
   ```

No other configuration is needed unless you want to change URLs, credentials, or browser settings (edit `.env`).

---

## 15. Troubleshooting

**`allure: command not found` or report fails**
→ Java is not installed or not in PATH. Install Java 11+ and reopen your terminal.

**`cucumber-js: command not found`**
→ Run `npm install` inside `playwright-bdd-framework/` first.

**`Error: Cucumber expected a CommonJS module`**
→ Make sure `tsconfig.json` has `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`.

**`You're calling functions on an instance of Cucumber that isn't running`**
→ You have a duplicate Cucumber installation. Run all commands from inside the `playwright-bdd-framework/` folder, not from the repo root using `npm --prefix`.

**Tests pass but Allure report is empty**
→ Check that `allure-results/` contains `.json` files after running. If the folder is empty, the reporter was not loaded — verify `allure-cucumberjs/reporter` is in the format list in `cucumber.cjs`.

**Browser does not open during tests**
→ `HEADLESS` defaults to `true`. Set `HEADLESS=false` in `.env` or prefix your command with `HEADLESS=false`.

**`.env` changes are not taking effect**
→ Make sure you edited `playwright-bdd-framework/.env`, not `.env.example`. Restart your terminal after editing.
