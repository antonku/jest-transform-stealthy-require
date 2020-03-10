import {
    BaseNode,
    CallExpression,
    Expression,
    FunctionExpression,
    Identifier,
    Literal, SimpleCallExpression,
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

export interface RequireExpression extends SimpleCallExpression {
    callee: {
        type: "Identifier",
        name: "require"
    };
    arguments: [
        {
            "type": "Literal",
            "value": string
        }
    ]
}

export function isRequireExpression(node: BaseNode): node is RequireExpression {
    return (node as RequireExpression).callee.name === 'require' &&
        Array.isArray((node as RequireExpression).arguments) &&
        isLiteral((node as RequireExpression).arguments[0]);
}