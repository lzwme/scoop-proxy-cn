module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: "eslint:recommended",
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module'
  },
  rules: {},
  ignorePatterns: [
    'bower_components',
    'lib',
    'node_modules'
  ]
}
  