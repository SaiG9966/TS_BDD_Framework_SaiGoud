# Quick Start (Users)

This is the short user guide for daily use.

## 1) Install

```bash
npm install
npx playwright install
```

## 2) Configure

```bash
# PowerShell
Copy-Item .env.example .env
```

Update only required values in `.env`:
- `BASE_URL`
- `APP_USERNAME`
- `APP_PASSWORD`
- `BROWSER` (`chromium` / `firefox` / `webkit`)
- `HEADLESS` (`true` / `false`)

## 3) Framework Structure (What to use where)

```text
src/
	config/
		cucumber.cjs           -> Cucumber runtime config (paths, formatters, tags)
		runtimeConfig.ts       -> Reads/validates environment variables
	pages/                   -> Page Object classes
	factories/               -> Test data builders/helpers
	tests/
		features/              -> Gherkin feature files (.feature)
		stepDefinitions/       -> Step implementations for Given/When/Then
		hooks/                 -> Before/After hooks (browser/context/page lifecycle)
		support/               -> Custom world and shared test context
	utils/                   -> Common helpers (actions, assertions, reports, step checks)
```

### Flow to understand
1. You write scenarios in `features`.
2. Cucumber matches them with `stepDefinitions`.
3. Step files call page methods from `pages`.
4. Hooks create and close browser resources per scenario.
5. Results go to Allure files/reports.

## 4) Run

```bash
npm run bdd
```

## 5) Useful Commands

```bash
npm run steps:check
npm run steps:generate -- --feature src/tests/features/yourFeature.feature
npm run report:generate
npm run report:open
npm run lint
```

## 6) Add a Test

1. Add a scenario in `src/tests/features/`.
2. Add matching steps in `src/tests/stepDefinitions/`.
3. Reuse or create page objects in `src/pages/`.
4. Run `npm run steps:check`.
5. Run `npm run bdd`.

## 7) Notes

- This template starts with 0 real test cases.
- Keep `.env.example` generic; do not commit real secrets.
- Full technical documentation: `README.md`.
