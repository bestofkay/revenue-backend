/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  passWithNoTests: true,
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};

module.exports = config;
