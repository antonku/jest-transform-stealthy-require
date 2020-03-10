import {BaseNode, Expression, FunctionExpression, VariableDeclarator} from "estree";
import { parseScript, Syntax } from "esprima";
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
  isVariableDeclarator
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
            if (isIdentifier(declaration.id) && expression && isRequireExpression(expression)) {
              const requiredModule = expression.arguments[0].value;

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
