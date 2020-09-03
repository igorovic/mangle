"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tag_1 = __importDefault(require("./shared/Tag"));
const code_red_1 = require("code-red");
class MustacheTagWrapper extends Tag_1.default {
    constructor(renderer, block, parent, node) {
        super(renderer, block, parent, node);
        this.var = { type: 'Identifier', name: 't' };
    }
    render(block, parent_node, parent_nodes) {
        const { init } = this.rename_this_method(block, value => code_red_1.x `@set_data(${this.var}, ${value})`);
        block.add_element(this.var, code_red_1.x `@text(${init})`, parent_nodes && code_red_1.x `@claim_text(${parent_nodes}, ${init})`, parent_node);
    }
}
exports.default = MustacheTagWrapper;
