# Typescript Framework BDD (Playwright + Cucumber)

A scalable **TypeScript BDD test automation framework** using:

- **Playwright**
- **Cucumber (Gherkin)**
- **Page Object Model (POM)**
- **Faker-based test data generation**
- HTML report support

---

## Project Structure

- `playwright-bdd-framework/src/tests/features` → `.feature` files
- `playwright-bdd-framework/src/tests/stepDefinitions` → step definitions
- `playwright-bdd-framework/src/pages` → page objects
- `playwright-bdd-framework/src/factories` → test data factory
- `playwright-bdd-framework/src/tests/support` → world/hooks/runtime support

---

## Prerequisites

- Node.js 18+
- npm
- VS Code (recommended)

---

## Setup

```bash
npm install
npm run setup
```

---

## Run Tests

```bash
npm run test
```

Run smoke tests (if configured):

```bash
npm run test:smoke
```

---

## Lint

```bash
npm run lint
```

---

## Reports

Generate report without opening browser:

```bash
npm run test:report:no-open
```

Open latest report:

```bash
npm run report:open
```

---

## Jenkins Integration (Run Directly in Jenkins)

This repository now includes a ready-to-run pipeline file: [Jenkinsfile](Jenkinsfile)

### What the Jenkins pipeline does

1. Checks out code from GitHub
2. Verifies Node/npm (and checks Java availability)
3. Runs framework setup (`npm run setup`) to install dependencies + Playwright browsers
4. Runs tests (parameterized command)
5. Generates reports (best effort, non-blocking)
6. Archives test artifacts (`allure-results`, `allure-report`, `reports`, `test-results`)

### Jenkins prerequisites

- Jenkins with **Pipeline** support
- Git configured in Jenkins
- Node.js 18+ available on agent
- Java 11+ recommended (required for Allure HTML generation)

### Create Jenkins job (direct run)

1. In Jenkins, create a new item: **Pipeline**
2. Under **Pipeline Definition**, choose **Pipeline script from SCM**
3. SCM: **Git**
4. Repository URL: `https://github.com/SaiG9966/TS_BDD_Framework_SaiGoud.git`
5. Branch specifier: `*/main`
6. Script Path: `Jenkinsfile`
7. Save and click **Build with Parameters**

### Available build parameters

- `TEST_COMMAND`: `test`, `test:smoke`, `test:regression`, `test:wip`, `test:report:no-open`
- `EXTRA_ARGS`: optional extra args (example: `--tags @smoke`)
- `RUN_SETUP`: run setup before tests
- `GENERATE_REPORTS`: generate Allure/Cucumber report after run

### Recommended first run

- `TEST_COMMAND = test`
- `RUN_SETUP = true`
- `GENERATE_REPORTS = true`

After completion, download artifacts from Jenkins build page under **Archived Artifacts**.

---

## Example BDD Scenario

```gherkin
Given user navigates to practice form page
When user enters student first name "faker"
And user enters student last name "faker"
And user enters student email "faker"
And user selects student gender "random"
Then registration should be successful
```

---

## GitHub Repository

https://github.com/SaiG9966/TS_BDD_Framework_SaiGoud

---

## Author

Thirumandas SaiTeja Goud
