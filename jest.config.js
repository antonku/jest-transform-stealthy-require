const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    ...tsjPreset.transform,
    "/node_modules/request-promise(-native)?/.+\\.js$": "<rootDir>/dist/index.js"
  },
  transformIgnorePatterns: ["/node_modules(?!/request-promise(-native)?)/"]
};
