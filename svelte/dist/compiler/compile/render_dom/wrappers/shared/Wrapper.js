"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
class Wrapper {
    constructor(renderer, block, parent, node) {
        this.node = node;
        // make these non-enumerable so that they can be logged sensibly
        // (TODO in dev only?)
        Object.defineProperties(this, {
            renderer: {
                value: renderer
            },
            parent: {
                value: parent
            }
        });
        this.can_use_innerhtml = !renderer.options.hydratable;
        this.is_static_content = !renderer.options.hydratable;
        block.wrappers.push(this);
    }
    cannot_use_innerhtml() {
        this.can_use_innerhtml = false;
        if (this.parent)
            this.parent.cannot_use_innerhtml();
    }
    not_static_content() {
        this.is_static_content = false;
        if (this.parent)
            this.parent.not_static_content();
    }
    get_or_create_anchor(block, parent_node, parent_nodes) {
        // TODO use this in EachBlock and IfBlock — tricky because
        // children need to be created first
        const needs_anchor = this.next ? !this.next.is_dom_node() : !parent_node || !this.parent.is_dom_node();
        const anchor = needs_anchor
            ? block.get_unique_name(`${this.var.name}_anchor`)
            : (this.next && this.next.var) || { type: 'Identifier', name: 'null' };
        if (needs_anchor) {
            block.add_element(anchor, code_red_1.x `@empty()`, parent_nodes && code_red_1.x `@empty()`, parent_node);
        }
        return anchor;
    }
    get_update_mount_node(anchor) {
        return ((this.parent && this.parent.is_dom_node())
            ? this.parent.var
            : code_red_1.x `${anchor}.parentNode`);
    }
    is_dom_node() {
        return (this.node.type === 'Element' ||
            this.node.type === 'Text' ||
            this.node.type === 'MustacheTag');
    }
    render(_block, _parent_node, _parent_nodes) {
        throw Error('Wrapper class is not renderable');
    }
}
exports.default = Wrapper;
