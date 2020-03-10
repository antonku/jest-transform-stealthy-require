const transformer = require('../lib');

describe('jest-stealthy-require-transform', () => {

  it('should transform stealthyRequire calls into jest.isolateModules() when stealthyRequire identifier has an initializer', () => {
    const source = `
      var stealthyRequire = require('stealthy-require');
      var request = stealthyRequire(require.cache, function () {
        return require('request');
        },
        function () {
          require('tough-cookie');
      }, module);
    `;
    const transformed = transformer.process(source);
    expect(transformed).toMatchSnapshot();
  });

  it('should transform stealthyRequire calls into jest.isolateModules() when stealthyRequire identifier does not have an initializer', () => {
    const source = `
      var stealthyRequire;
      stealthyRequire = require('stealthy-require');
      var request = stealthyRequire(require.cache, function () {
        return require('request');
        },
        function () {
          require('tough-cookie');
      }, module);
    `;
    const transformed = transformer.process(source);
    expect(transformed).toMatchSnapshot();
  });

});
