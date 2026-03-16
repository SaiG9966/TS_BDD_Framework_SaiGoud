require("dotenv").config();

const configuredFeaturePath = process.env.FEATURE_PATH;

module.exports = {
  default: {
    import: [
      "src/tests/support/**/*.ts",
      "src/tests/hooks/**/*.ts",
      "src/tests/stepDefinitions/**/*.ts"
    ],
    paths: configuredFeaturePath ? [configuredFeaturePath] : ["src/tests/features/**/*.feature"],
    format: [
      "progress",
      "allure-cucumberjs/reporter",
      "json:reports/cucumber-report.json"
    ],
    formatOptions: {
      resultsDir: process.env.ALLURE_RESULTS_DIR || "allure-results"
    },
    tags: process.env.TAGS,
    parallel: Number(process.env.PARALLEL || 0),
    retry: Number(process.env.RETRY || 0),
    publishQuiet: true
  }
};