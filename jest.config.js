/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFiles: ['./mocks/speech.js'],
};

module.exports = config;
