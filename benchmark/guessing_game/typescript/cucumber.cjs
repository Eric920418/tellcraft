module.exports = {
  default: {
    import: ['src/tests/stepdefs/**/*.ts'],
    loader: ['ts-node/esm'],
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['src/tests/features/**/*.feature'],
    parallel: 1
  }
};
