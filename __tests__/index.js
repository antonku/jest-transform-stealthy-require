const transformer = require('../transformer');

describe('jest-stealthy-require-transform', () => {

  it('should transform stealthRequire calls into jest.isolateModules()', () => {
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

});
