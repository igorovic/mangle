"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const Wrapper_1 = __importDefault(require("./Wrapper"));
class Tag extends Wrapper_1.default {
    constructor(renderer, block, parent, node) {
        super(renderer, block, parent, node);
        this.cannot_use_innerhtml();
        if (!this.is_dependencies_static()) {
            this.not_static_content();
        }
        block.add_dependencies(node.expression.dependencies);
    }
    is_dependencies_static() {
        return this.node.expression.contextual_dependencies.size === 0 && this.node.expression.dynamic_dependencies().length === 0;
    }
    rename_this_method(block, update) {
        const dependencies = this.node.expression.dynamic_dependencies();
        let snippet = this.node.expression.manipulate(block);
        const value = this.node.should_cache && block.get_unique_name(`${this.var.name}_value`);
        const content = this.node.should_cache ? value : snippet;
        snippet = code_red_1.x `${snippet} + ""`;
        if (this.node.should_cache)
            block.add_variable(value, snippet); // TODO may need to coerce snippet to string
        if (dependencies.length > 0) {
            let condition = block.renderer.dirty(dependencies);
            if (block.has_outros) {
                condition = code_red_1.x `!#current || ${condition}`;
            }
            const update_cached_value = code_red_1.x `${value} !== (${value} = ${snippet})`;
            if (this.node.should_cache) {
                condition = code_red_1.x `${condition} && ${update_cached_value}`;
            }
            block.chunks.update.push(code_red_1.b `if (${condition}) ${update(content)}`);
        }
        return { init: content };
    }
}
exports.default = Tag;
