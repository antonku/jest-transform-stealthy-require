# jest-transform-stealthy-require

![Node.js CI](https://github.com/antonku/jest-transform-stealthy-require/workflows/Node.js%20CI/badge.svg?branch=master)

Transforms `stealthy-require` calls into `jest.isolateModules()`

# Motivation

The purpose of this module is to address Jest + stealthy-require compatibility [issue](https://github.com/analog-nico/stealthy-require/issues/5) which causes issues like [Unable to expose method "then"](https://github.com/request/request-promise/issues/247) on modules that depend on stealthy-require.

# Getting started

## Installation
```bash
npm install --save-dev jest-transform-stealthy-require
```

## Jest configuration

### For request-promise/request-promise native issue
#### Jest
**jest.config.js**
```javascript
const { requestPromise } = require('jest-transform-stealthy-require/dist/presets');

module.exports = {
  // ...
  transform: {
    ...requestPromise.transform
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern]
};
```
#### Jest + babel-jest
**jest.config.js**
```javascript
const { requestPromise } = require('jest-transform-stealthy-require/dist/presets');

module.exports = {
  // ...
  transform: {
    ...requestPromise.transform,
    "^.+\\.[t|j]sx?$": "babel-jest"
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern]
}
```

#### Jest + ts-jest
**jest.config.js**
```javascript
const { requestPromise } = require('jest-transform-stealthy-require/dist/presets');
const { defaults: tsjPreset } = require('ts-jest/presets');
// [OR] const { jsWithTs: tsjPreset } = require('ts-jest/presets');
// [OR] const { jsWithBabel: tsjPreset } = require('ts-jest/presets');

module.exports = {
  // ...
  transform: {
    ...requestPromise.transform,
    ...tsjPreset.transform
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern]
}
```
### For other cases

The transformer can be used to replace stealthy-require calls in arbitrary modules. Simply specify the file pattern to for the modules that you would like to transform in your Jest config:

**jest.config.js**
```javascript

module.exports = {
  // ...
  transform: {
    'my_pattern_to_module_to_transform': 'jest-transform-stealthy-require'
  }
};
```
