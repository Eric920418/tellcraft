/**
 * Cucumber.js configuration for SpecFormula BDD tests.
 *
 * Usage:
 *   pnpm bdd                    # Run e2e features (default)
 *   pnpm bdd:spec               # Run spec/ features (needs APP_MODULE_PATH)
 *
 * Environment:
 *   TEST_DATABASE_URL=postgresql://user:pass@localhost/tellcraft_test
 *   APP_MODULE_PATH=./path/to/app  (optional, defaults to test-app)
 *   ISA_PATH=./path/to/isa.yml     (optional, defaults to e2e/isa.yml)
 */
module.exports = {
  default: {
    paths: ['cucumber/features/**/*.feature'],
    require: ['cucumber/support/**/*.ts'],
    requireModule: ['tsx'],
    format: ['progress-bar'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
  spec: {
    paths: ['../spec/features/**/*.feature'],
    require: ['cucumber/support/**/*.ts'],
    requireModule: ['tsx'],
    format: ['progress-bar'],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
};
