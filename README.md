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

`https://github.com/SaiG9966/Typescript_Framework_BDD_saiteja.git`

---

## Author

Thirumandas SaiTeja Goud
