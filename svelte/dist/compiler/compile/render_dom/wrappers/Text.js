"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const code_red_1 = require("code-red");
class TextWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, data) {
        super(renderer, block, parent, node);
        this.skip = this.node.should_skip();
        this.data = data;
        this.var = (this.skip ? null : code_red_1.x `t`);
    }
    use_space() {
        if (this.renderer.component.component_options.preserveWhitespace)
            return false;
        if (/[\S\u00A0]/.test(this.data))
            return false;
        let node = this.parent && this.parent.node;
        while (node) {
            if (node.type === 'Element' && node.name === 'pre') {
                return false;
            }
            node = node.parent;
        }
        return true;
    }
    render(block, parent_node, parent_nodes) {
        if (this.skip)
            return;
        const use_space = this.use_space();
        block.add_element(this.var, use_space ? code_red_1.x `@space()` : code_red_1.x `@text("${this.data}")`, parent_nodes && (use_space ? code_red_1.x `@claim_space(${parent_nodes})` : code_red_1.x `@claim_text(${parent_nodes}, "${this.data}")`), parent_node);
    }
}
exports.default = TextWrapper;
