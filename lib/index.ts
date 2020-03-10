import {BaseNode, Expression, FunctionExpression, VariableDeclarator} from "estree";
import { parseScript, Syntax } from "esprima";
import * as estraverse from "estraverse";
import * as escodegen from "escodegen";
import { createIsolateModulesAst } from "./isolate-modules-ast";
import {isCallExpression, isFunctionExpression, isIdentifier, isLiteral, isVariableDeclarator} from "./guards";

function isStealthyRequireImport(callExpression: Expression): boolean {
  if (isCallExpression(callExpression) && (callExpression.callee.type === 'Identifier') && (callExpression.callee.name === 'require')) {
    return callExpression.arguments.some((arg): boolean => {
      return isLiteral(arg) && (String(arg.value).toLowerCase() === 'stealthy-require');
    });
  }
  return false;
}

function getStealthyRequireIdentifiers(ast: BaseNode): string[] {
  const stealthyRequireIdentifiers: string[] = [];

  estraverse.traverse(ast, {
    enter: (node) => {
      switch (node.type) {
        case Syntax.VariableDeclarator:
          if (node.init && node.init.callee && isStealthyRequireImport(node.init)) {
            stealthyRequireIdentifiers.push(node.id.name);
          }
          break;
        case Syntax.AssignmentExpression:
          if (isStealthyRequireImport(node.right)) {
            stealthyRequireIdentifiers.push(node.left.name);
          }
          break;
      }
    }
  });

  return stealthyRequireIdentifiers;
}

function replaceStealthyRequireCalls<T extends BaseNode>(ast: T, identifiers: string[]): T {

  estraverse.traverse(ast,  {
    enter: (node, parent) => {
      if (!Array.isArray(node.declarations)) {
        return;
      }

      node.declarations.forEach((declaration: BaseNode) => {
        if (isVariableDeclarator(declaration) &&
            declaration.init &&
            isCallExpression(declaration.init) &&
            isIdentifier(declaration.init.callee) &&
            identifiers.includes(declaration.init.callee.name)
        ) {

          const fn = declaration.init.arguments[1];

          if (!isFunctionExpression(fn)) {
            return;
          }

          fn.body.body.forEach((innerNode) => {
            const expression = ("argument" in innerNode) && innerNode.argument;
            if (isIdentifier(declaration.id) && expression && isCallExpression(expression) && isIdentifier(expression.callee) && expression.callee.name === 'require') {
              const requiredModule = isLiteral(expression.arguments[0]) && expression.arguments[0].value;

              const isolateModulesNode = createIsolateModulesAst(declaration.id.name, String(requiredModule));
              const currNodePos = parent.body.indexOf(node);

              delete declaration.init;
              parent.body.splice(currNodePos + 1, 0, isolateModulesNode);
            }
          })
        }
      });
    }
  });

  return ast;
}

module.exports = {
  process(src: string): string {
    const program = parseScript(src);

    const identifiers = getStealthyRequireIdentifiers(program);
    if (!identifiers.length) {
      return src;
    }

    const updatedProgram = replaceStealthyRequireCalls(program, identifiers);

    return escodegen.generate(updatedProgram);
  },
};
