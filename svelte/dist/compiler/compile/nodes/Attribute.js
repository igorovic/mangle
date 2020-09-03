"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stringify_1 = require("../utils/stringify");
const add_to_set_1 = __importDefault(require("../utils/add_to_set"));
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const code_red_1 = require("code-red");
class Attribute extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.scope = scope;
        if (info.type === 'Spread') {
            this.name = null;
            this.is_spread = true;
            this.is_true = false;
            this.expression = new Expression_1.default(component, this, scope, info.expression);
            this.dependencies = this.expression.dependencies;
            this.chunks = null;
            this.is_static = false;
        }
        else {
            this.name = info.name;
            this.is_true = info.value === true;
            this.is_static = true;
            this.dependencies = new Set();
            this.chunks = this.is_true
                ? []
                : info.value.map(node => {
                    if (node.type === 'Text')
                        return node;
                    this.is_static = false;
                    const expression = new Expression_1.default(component, this, scope, node.expression);
                    add_to_set_1.default(this.dependencies, expression.dependencies);
                    return expression;
                });
        }
    }
    get_dependencies() {
        if (this.is_spread)
            return this.expression.dynamic_dependencies();
        const dependencies = new Set();
        this.chunks.forEach(chunk => {
            if (chunk.type === 'Expression') {
                add_to_set_1.default(dependencies, chunk.dynamic_dependencies());
            }
        });
        return Array.from(dependencies);
    }
    get_value(block) {
        if (this.is_true)
            return code_red_1.x `true`;
        if (this.chunks.length === 0)
            return code_red_1.x `""`;
        if (this.chunks.length === 1) {
            return this.chunks[0].type === 'Text'
                ? stringify_1.string_literal(this.chunks[0].data)
                : this.chunks[0].manipulate(block);
        }
        let expression = this.chunks
            .map(chunk => chunk.type === 'Text' ? stringify_1.string_literal(chunk.data) : chunk.manipulate(block))
            .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
        if (this.chunks[0].type !== 'Text') {
            expression = code_red_1.x `"" + ${expression}`;
        }
        return expression;
    }
    get_static_value() {
        if (this.is_spread || this.dependencies.size > 0)
            return null;
        return this.is_true
            ? true
            : this.chunks[0]
                // method should be called only when `is_static = true`
                ? this.chunks[0].data
                : '';
    }
    should_cache() {
        return this.is_static
            ? false
            : this.chunks.length === 1
                // @ts-ignore todo: probably error
                ? this.chunks[0].node.type !== 'Identifier' || this.scope.names.has(this.chunks[0].node.name)
                : true;
    }
}
exports.default = Attribute;
