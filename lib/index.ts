import { BaseNode } from "estree";
import { parseScript } from "esprima";
import * as estraverse from "estraverse";
import * as escodegen from "escodegen";
import { createIsolateModulesAst } from "./isolate-modules-ast";
import {
  isCallExpression,
  isFunctionExpression,
  isIdentifier,
  isRequireExpression,
  isStealthyRequireVariableDeclarator,
  isStealthyRequireAssignmentExpression,
  isVariableDeclarator,
  isAssignmentExpression,
  isExpressionStatement, isVariableDeclaration
} from "./guards";

function getStealthyRequireIdentifiers(ast: BaseNode): string[] {
  const stealthyRequireIdentifiers: string[] = [];

  estraverse.traverse(ast, {
    enter: (node) => {
      if (isStealthyRequireVariableDeclarator(node)) {
        stealthyRequireIdentifiers.push(node.id.name);
        return;
      }
      if (isStealthyRequireAssignmentExpression(node)) {
        stealthyRequireIdentifiers.push(node.left.name);
        return;
      }
    }
  });

  return stealthyRequireIdentifiers;
}

function replaceCacheBypassExpression<T extends BaseNode>(
    ast: T,
    moduleIdentifier: string | false,
    callback
): void {

  if (!isFunctionExpression(ast) || !moduleIdentifier) {
    return;
  }

  estraverse.traverse(ast,  {
    enter: (expression) => {
      if (expression && isRequireExpression(expression)) {
        const requiredModule = expression.arguments[0].value;

        const isolateModulesNode = createIsolateModulesAst(moduleIdentifier, String(requiredModule));
        callback(isolateModulesNode);
      }
    }
  })
}

function replaceStealthyRequireCalls<T extends BaseNode>(ast: T, identifiers: string[]): T {

  estraverse.traverse(ast,  {
    enter: (node, parent) => {
      if (isExpressionStatement(node) &&
          isAssignmentExpression(node.expression) &&
          isCallExpression(node.expression.right) &&
          isIdentifier(node.expression.right.callee) &&
          identifiers.includes(node.expression.right.callee.name)
      ) {
        const fn = node.expression.right.arguments[1];
        const moduleIdentifier = isIdentifier(node.expression.left) && node.expression.left.name;

        replaceCacheBypassExpression(fn, moduleIdentifier, (isolateModulesNode) => {
          const currNodePos = parent.body.indexOf(node);
          parent.body.splice(currNodePos, 1, isolateModulesNode);
        });
      }

      if (!isVariableDeclaration(node)) {
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
          const moduleIdentifier = isIdentifier(declaration.id) && declaration.id.name;

          replaceCacheBypassExpression(fn, moduleIdentifier, (isolateModulesNode) => {
            const currNodePos = parent.body.indexOf(node);
            delete declaration.init;
            parent.body.splice(currNodePos + 1, 0, isolateModulesNode);
          });
        }
      });
    }
  });

  return ast;
}

export = {
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
