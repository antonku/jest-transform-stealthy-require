import {
    AssignmentExpression,
    BaseNode,
    CallExpression,
    Expression, ExpressionStatement,
    FunctionExpression,
    Identifier,
    Literal, SimpleCallExpression, SimpleLiteral, VariableDeclaration,
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

export function isVariableDeclaration(node: BaseNode): node is VariableDeclaration {
    return (node as VariableDeclaration).type === Syntax.VariableDeclaration;
}

export function isVariableDeclarator(node: BaseNode): node is VariableDeclarator {
    return (node as VariableDeclarator).type === Syntax.VariableDeclarator;
}

export function isFunctionExpression(node: BaseNode): node is FunctionExpression {
    return (node as FunctionExpression).type === Syntax.FunctionExpression;
}

export function isExpressionStatement(node: BaseNode): node is ExpressionStatement {
    return (node as ExpressionStatement).type === Syntax.ExpressionStatement;
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
    return callee &&
        callee.name === 'require' &&
        Array.isArray(args) &&
        args.length === 1 &&
        isLiteral(args[0]);
}

interface GenericLiteral<T extends string> extends SimpleLiteral {
    value: T
}

interface RequireImport<T extends string> extends RequireExpression {
    arguments: [GenericLiteral<T>];
}

function isStealthyRequireImport(node: BaseNode): node is RequireImport<"stealthy-require"> {
    return isRequireExpression(node) && node.arguments[0].value === "stealthy-require";
}

export interface RequireVariableDeclarator<T extends string> extends VariableDeclarator {
    init: RequireImport<T>;
    id: Identifier;
}

interface GenericAssignmentExpression<T extends string> extends AssignmentExpression {
    left: Identifier;
    right: RequireImport<T>;
}

export function isStealthyRequireVariableDeclarator(node: BaseNode): node is RequireVariableDeclarator<"stealthy-require"> {
    return isVariableDeclarator(node) && !!node.init && isStealthyRequireImport(node.init);
}

export function isStealthyRequireAssignmentExpression(node: BaseNode): node is GenericAssignmentExpression<"stealthy-require"> {
    return isAssignmentExpression(node) && isStealthyRequireImport(node.right);
}
