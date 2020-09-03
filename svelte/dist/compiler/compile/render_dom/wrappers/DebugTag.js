"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const add_to_set_1 = __importDefault(require("../../utils/add_to_set"));
const code_red_1 = require("code-red");
class DebugTagWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, _strip_whitespace, _next_sibling) {
        super(renderer, block, parent, node);
    }
    render(block, _parent_node, _parent_nodes) {
        const { renderer } = this;
        const { component } = renderer;
        if (!renderer.options.dev)
            return;
        const { var_lookup } = component;
        const start = component.locate(this.node.start + 1);
        const end = { line: start.line, column: start.column + 6 };
        const loc = { start, end };
        const debug = {
            type: 'DebuggerStatement',
            loc
        };
        if (this.node.expressions.length === 0) {
            // Debug all
            block.chunks.create.push(debug);
            block.chunks.update.push(debug);
        }
        else {
            const log = {
                type: 'Identifier',
                name: 'log',
                loc
            };
            const dependencies = new Set();
            this.node.expressions.forEach(expression => {
                add_to_set_1.default(dependencies, expression.dependencies);
            });
            const contextual_identifiers = this.node.expressions
                .filter(e => {
                const variable = var_lookup.get(e.node.name);
                return !(variable && variable.hoistable);
            })
                .map(e => e.node.name);
            const logged_identifiers = this.node.expressions.map(e => code_red_1.p `${e.node.name}`);
            const debug_statements = code_red_1.b `
				${contextual_identifiers.map(name => code_red_1.b `const ${name} = ${renderer.reference(name)};`)}
				@_console.${log}({ ${logged_identifiers} });
				debugger;`;
            if (dependencies.size) {
                const condition = renderer.dirty(Array.from(dependencies));
                block.chunks.update.push(code_red_1.b `
					if (${condition}) {
						${debug_statements}
					}
				`);
            }
            block.chunks.create.push(code_red_1.b `{
				${debug_statements}
			}`);
        }
    }
}
exports.default = DebugTagWrapper;
