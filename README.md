# jest-transform-stealthy-require

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

module.exports = {
  // ...
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
    ...requestPromise.transform
  },
  transformIgnorePatterns: [requestPromise.transformIgnorePattern]
}
```

#### Jest + ts-jest
**jest.config.js**
```javascript
const { defaults: tsjPreset } = require('ts-jest/presets');
// [OR] const { jsWithTs: tsjPreset } = require('ts-jest/presets');
// [OR] const { jsWithBabel: tsjPreset } = require('ts-jest/presets');

module.exports = {
  // ...
  transform: {
    ...tsjPreset.transform,
    ...requestPromise.transform
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
    'file_pattern_for_module_that_uses_stealthy_require': 'jest-transform-stealthy-require'
  }
};
```
