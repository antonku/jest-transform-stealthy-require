import {
    AssignmentExpression,
    BaseNode,
    CallExpression,
    Expression,
    FunctionExpression,
    Identifier,
    Literal, SimpleCallExpression, SimpleLiteral,
    VariableDeclarator
} from "estree";
import {Syntax} from "esprima";

export function isCallExpression(node: Expression): node is CallExpression {
    return (node as CallExpression).type === Syntax.CallExpression;
}

export function isLiteral(node: BaseNode): node is Literal {
    return (node as Literal).type === Syntax.Literal;
}

export function isIdentifier(node: BaseNode): node is Identifier {
    return (node as Identifier).type === Syntax.Identifier;
}

export function isVariableDeclarator(node: BaseNode): node is VariableDeclarator {
    return (node as VariableDeclarator).type === Syntax.VariableDeclarator;
}

export function isFunctionExpression(node: BaseNode): node is FunctionExpression {
    return (node as FunctionExpression).type === Syntax.FunctionExpression;
}

export function isAssignmentExpression(node: BaseNode): node is AssignmentExpression {
    return (node as AssignmentExpression).type === Syntax.AssignmentExpression;
}

interface RequireIdentifier extends Identifier {
    name: "require";
}

export interface RequireExpression extends SimpleCallExpression {
    callee: RequireIdentifier;
    arguments: [Literal];
}

export function isRequireExpression(node: BaseNode): node is RequireExpression {
    const { callee, arguments: args } = (node as RequireExpression);
    return callee && callee.name === 'require' &&
        Array.isArray(args) &&
        args.length === 1 &&
        isLiteral(args[0]);
}

interface StealthyRequireLiteral extends SimpleLiteral {
    value: "stealthy-require";
}

interface StealthyRequireImport extends RequireExpression {
    arguments: [StealthyRequireLiteral];
}

function isStealthyRequireImport(node: BaseNode): node is StealthyRequireImport {
    return isRequireExpression(node) && node.arguments[0].value === "stealthy-require";
}

export interface StealthyRequireVariableDeclarator extends VariableDeclarator {
    init: StealthyRequireImport;
    id: Identifier;
}

export function isStealthyRequireVariableDeclarator(node: BaseNode): node is StealthyRequireVariableDeclarator {
    return isVariableDeclarator(node) && !!node.init && isStealthyRequireImport(node.init);
}

interface StealthyRequireAssignmentExpression extends AssignmentExpression {
    left: Identifier;
    right: StealthyRequireImport;
}

export function isStealthyRequireAssignmentExpression(node: BaseNode): node is StealthyRequireAssignmentExpression {
    return isAssignmentExpression(node) && isStealthyRequireImport(node.right);
}
