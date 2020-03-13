import { Syntax } from "esprima";

export function createIsolateModulesAst(moduleIdentifier: string, moduleName: string): object {
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
