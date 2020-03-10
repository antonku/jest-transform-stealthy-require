var esprima = require('esprima');
var escodegen = require('escodegen');

function jestIsolateModulesFactory(moduleIdentifier, moduleName) {
  return {
    type: esprima.Syntax.ExpressionStatement,
    expression: {
      type: esprima.Syntax.CallExpression,
      callee: {
        type: esprima.Syntax.MemberExpression,
        object: {
          type: esprima.Syntax.Identifier,
          name: 'jest'
        },
        property: {
          type: esprima.Syntax.Identifier,
          name: 'isolateModules'
        }
      },
      arguments: [
        {
          type: esprima.Syntax.FunctionExpression,
          generator: false,
          params: [],
          body: {
            type: esprima.Syntax.BlockStatement,
            body: [
              {
                type: esprima.Syntax.ExpressionStatement,
                expression: {
                  type: esprima.Syntax.AssignmentExpression,
                  operator: '=',
                  left: {
                    type: esprima.Syntax.Identifier,
                    name: moduleIdentifier
                  },
                  right: {
                    type: esprima.Syntax.CallExpression,
                    callee: {
                      type: esprima.Syntax.Identifier,
                      name: 'require'
                    },
                    arguments: [
                      {
                        type: esprima.Syntax.Literal,
                        value: moduleName
                      }
                    ]
                  }
                }
              }
            ],
          }
        }
      ]
    }
  };
}

function isStealthyRequireDeclaration(declaration) {
  if (!declaration.init || !declaration.init.callee) {
    return false;
  }
  var callee = declaration.init.callee;
  var args = declaration.init.arguments;
  if ((callee.type === 'Identifier') && (callee.name === 'require')) {
    return args.some(function(arg) {
      return arg.value && (arg.value.toLowerCase() === 'stealthy-require');
    });
  }
  return false;
}

function identifierReplacerFactory (identifier) {
  return function replacer(parent, node) {
    if (node.block && node.block.body) {
      node.block.body.forEach(function (childNode) {
        replacer(node, childNode);
      });
    }
    if (node.declarations) {
      node.declarations.forEach(function (declaration) {
        if (declaration.init && declaration.init.callee && declaration.init.callee.name === identifier) {
          var fn = declaration.init.arguments[1];
          var requiredModule;
          fn.body.body.forEach(function (innerNode) {
            if (innerNode.argument && innerNode.argument.callee && innerNode.argument.callee.name === 'require') {
              requiredModule = innerNode.argument.arguments[0].value;
              delete declaration.init;
              var isolateModulesNode = jestIsolateModulesFactory(declaration.id.name, requiredModule);
              var currNodePos = parent.body.indexOf(node);
              parent.body.splice(currNodePos + 1, 0, isolateModulesNode);
            }
          })
        }
      });
    }
  }
}

function transform(src) {
  var program = esprima.parseScript(src);
  var variableDeclarations = program.body.filter(function(node) {
    return node.type === 'VariableDeclaration';
  });

  var stealthyRequireIdentifiers = [];
  variableDeclarations.forEach(function(node) {
    var declarations = node.declarations || [];
    declarations.forEach(declaration => {
      if (isStealthyRequireDeclaration(declaration)) {
        stealthyRequireIdentifiers.push(declaration.id.name);
      }
    });
  });

  stealthyRequireIdentifiers.forEach(function(identifier) {
    var replacer = identifierReplacerFactory(identifier);
    program.body.forEach(function (node) {
      replacer(program, node);
    })
  });
  return escodegen.generate(program);
}


module.exports = {
  process(src, filename) {
    return transform(src);
  },
};
