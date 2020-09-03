"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const stringify_1 = require("../../utils/stringify");
const add_to_set_1 = __importDefault(require("../../utils/add_to_set"));
class TitleWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, _strip_whitespace, _next_sibling) {
        super(renderer, block, parent, node);
    }
    render(block, _parent_node, _parent_nodes) {
        const is_dynamic = !!this.node.children.find(node => node.type !== 'Text');
        if (is_dynamic) {
            let value;
            const all_dependencies = new Set();
            // TODO some of this code is repeated in Tag.ts — would be good to
            // DRY it out if that's possible without introducing crazy indirection
            if (this.node.children.length === 1) {
                // single {tag} — may be a non-string
                // @ts-ignore todo: check this
                const { expression } = this.node.children[0];
                value = expression.manipulate(block);
                add_to_set_1.default(all_dependencies, expression.dependencies);
            }
            else {
                // '{foo} {bar}' — treat as string concatenation
                value = this.node.children
                    .map(chunk => {
                    if (chunk.type === 'Text')
                        return stringify_1.string_literal(chunk.data);
                    chunk.expression.dependencies.forEach(d => {
                        all_dependencies.add(d);
                    });
                    return chunk.expression.manipulate(block);
                })
                    .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
                if (this.node.children[0].type !== 'Text') {
                    value = code_red_1.x `"" + ${value}`;
                }
            }
            const last = this.node.should_cache && block.get_unique_name(`title_value`);
            if (this.node.should_cache)
                block.add_variable(last);
            const init = this.node.should_cache ? code_red_1.x `${last} = ${value}` : value;
            block.chunks.init.push(code_red_1.b `@_document.title = ${init};`);
            const updater = code_red_1.b `@_document.title = ${this.node.should_cache ? last : value};`;
            if (all_dependencies.size) {
                const dependencies = Array.from(all_dependencies);
                let condition = block.renderer.dirty(dependencies);
                if (block.has_outros) {
                    condition = code_red_1.x `!#current || ${condition}`;
                }
                if (this.node.should_cache) {
                    condition = code_red_1.x `${condition} && (${last} !== (${last} = ${value}))`;
                }
                block.chunks.update.push(code_red_1.b `
					if (${condition}) {
						${updater}
					}`);
            }
        }
        else {
            const value = this.node.children.length > 0
                ? stringify_1.string_literal(this.node.children[0].data)
                : code_red_1.x `""`;
            block.chunks.hydrate.push(code_red_1.b `@_document.title = ${value};`);
        }
    }
}
exports.default = TitleWrapper;
