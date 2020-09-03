"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const Tag_1 = __importDefault(require("./shared/Tag"));
const is_head_1 = require("./shared/is_head");
class RawMustacheTagWrapper extends Tag_1.default {
    constructor(renderer, block, parent, node) {
        super(renderer, block, parent, node);
        this.var = { type: 'Identifier', name: 'raw' };
        this.cannot_use_innerhtml();
        this.not_static_content();
    }
    render(block, parent_node, _parent_nodes) {
        const in_head = is_head_1.is_head(parent_node);
        const can_use_innerhtml = !in_head && parent_node && !this.prev && !this.next;
        if (can_use_innerhtml) {
            const insert = content => code_red_1.b `${parent_node}.innerHTML = ${content};`[0];
            const { init } = this.rename_this_method(block, content => insert(content));
            block.chunks.mount.push(insert(init));
        }
        else {
            const needs_anchor = in_head || (this.next ? !this.next.is_dom_node() : (!this.parent || !this.parent.is_dom_node()));
            const html_tag = block.get_unique_name('html_tag');
            const html_anchor = needs_anchor && block.get_unique_name('html_anchor');
            block.add_variable(html_tag);
            const { init } = this.rename_this_method(block, content => code_red_1.x `${html_tag}.p(${content})`);
            const update_anchor = needs_anchor ? html_anchor : this.next ? this.next.var : 'null';
            block.chunks.hydrate.push(code_red_1.b `${html_tag} = new @HtmlTag(${update_anchor});`);
            block.chunks.mount.push(code_red_1.b `${html_tag}.m(${init}, ${parent_node || '#target'}, ${parent_node ? null : '#anchor'});`);
            if (needs_anchor) {
                block.add_element(html_anchor, code_red_1.x `@empty()`, code_red_1.x `@empty()`, parent_node);
            }
            if (!parent_node || in_head) {
                block.chunks.destroy.push(code_red_1.b `if (detaching) ${html_tag}.d();`);
            }
        }
    }
}
exports.default = RawMustacheTagWrapper;
