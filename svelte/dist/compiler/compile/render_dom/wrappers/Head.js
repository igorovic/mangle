"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const Fragment_1 = __importDefault(require("./Fragment"));
const code_red_1 = require("code-red");
class HeadWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, strip_whitespace, next_sibling) {
        super(renderer, block, parent, node);
        this.can_use_innerhtml = false;
        this.fragment = new Fragment_1.default(renderer, block, node.children, this, strip_whitespace, next_sibling);
    }
    render(block, _parent_node, _parent_nodes) {
        let nodes;
        if (this.renderer.options.hydratable && this.fragment.nodes.length) {
            nodes = block.get_unique_name('head_nodes');
            block.chunks.claim.push(code_red_1.b `const ${nodes} = @query_selector_all('[data-svelte="${this.node.id}"]', @_document.head);`);
        }
        this.fragment.render(block, code_red_1.x `@_document.head`, nodes);
        if (nodes && this.renderer.options.hydratable) {
            block.chunks.claim.push(code_red_1.b `${nodes}.forEach(@detach);`);
        }
    }
}
exports.default = HeadWrapper;
