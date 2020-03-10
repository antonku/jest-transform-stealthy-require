const transform = require('./transformer-parser');

module.exports = {
  process(src, filename) {
//     src = src.replace(/var request = stealthyRequire.*module\);/s, `
// var request;
// jest.isolateModules(function () {
//   request = require('request');
// })
//     `)
    return transform(src);
  },
};
