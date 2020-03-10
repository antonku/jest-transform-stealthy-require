import { parseScript, Syntax } from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';

function jestIsolateModulesFactory(moduleIdentifier: string, moduleName: string) {
  return {
    type: Syntax.ExpressionStatement,
    expression: {
      type: Syntax.CallExpression,
      callee: {
        type: Syntax.MemberExpression,
        object: {
          type: Syntax.Identifier,
          name: 'jest'
        },
        property: {
          type: Syntax.Identifier,
          name: 'isolateModules'
        }
      },
      arguments: [
        {
          type: Syntax.FunctionExpression,
          generator: false,
          params: [],
          body: {
            type: Syntax.BlockStatement,
            body: [
              {
                type: Syntax.ExpressionStatement,
                expression: {
                  type: Syntax.AssignmentExpression,
                  operator: '=',
                  left: {
                    type: Syntax.Identifier,
                    name: moduleIdentifier
                  },
                  right: {
                    type: Syntax.CallExpression,
                    callee: {
                      type: Syntax.Identifier,
                      name: 'require'
                    },
                    arguments: [
                      {
                        type: Syntax.Literal,
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

function transform(src: string) {
  const program = parseScript(src);

  const stealthyRequireIdentifiers = [];
  estraverse.traverse(program, {
    enter: (node) => {
        if (isStealthyRequireDeclaration(node) && ('name' in node.id)) {
          stealthyRequireIdentifiers.push(node.id.name);
        }
    }
  });

  estraverse.traverse(program,  {
    enter: (node, parent) => {
      if (!Array.isArray(node.declarations)) {
        return;
      }
      node.declarations.forEach((declaration) => {
        if (declaration.init && declaration.init.callee && stealthyRequireIdentifiers.includes(declaration.init.callee.name)) {
          const fn = declaration.init.arguments[1];
          let requiredModule;
          fn.body.body.forEach(function (innerNode) {
            if (innerNode.argument && innerNode.argument.callee && innerNode.argument.callee.name === 'require') {
              requiredModule = innerNode.argument.arguments[0].value;
              delete declaration.init;
              const isolateModulesNode = jestIsolateModulesFactory(declaration.id.name, requiredModule);
              const currNodePos = parent.body.indexOf(node);
              parent.body.splice(currNodePos + 1, 0, isolateModulesNode);
            }
          })
        }
      });
    }
  });

  return escodegen.generate(program);
}


module.exports = {
  process(src) {
    return transform(src);
  },
};
