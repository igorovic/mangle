"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const estree_walker_1 = require("estree-walker");
const applicable = new Set(['Identifier', 'ObjectExpression', 'ArrayExpression', 'Property']);
class Let extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.names = [];
        this.name = { type: 'Identifier', name: info.name };
        const { names } = this;
        if (info.expression) {
            this.value = info.expression;
            estree_walker_1.walk(info.expression, {
                enter(node) {
                    if (!applicable.has(node.type)) {
                        component.error(node, {
                            code: 'invalid-let',
                            message: `let directive value must be an identifier or an object/array pattern`
                        });
                    }
                    if (node.type === 'Identifier') {
                        names.push(node.name);
                    }
                    // slightly unfortunate hack
                    if (node.type === 'ArrayExpression') {
                        node.type = 'ArrayPattern';
                    }
                    if (node.type === 'ObjectExpression') {
                        node.type = 'ObjectPattern';
                    }
                }
            });
        }
        else {
            names.push(this.name.name);
        }
    }
}
exports.default = Let;
