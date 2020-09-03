"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Node {
    constructor(component, parent, _scope, info) {
        this.start = info.start;
        this.end = info.end;
        this.type = info.type;
        // this makes properties non-enumerable, which makes logging
        // bearable. might have a performance cost. TODO remove in prod?
        Object.defineProperties(this, {
            component: {
                value: component
            },
            parent: {
                value: parent
            }
        });
    }
    cannot_use_innerhtml() {
        if (this.can_use_innerhtml !== false) {
            this.can_use_innerhtml = false;
            if (this.parent)
                this.parent.cannot_use_innerhtml();
        }
    }
    find_nearest(selector) {
        if (selector.test(this.type))
            return this;
        if (this.parent)
            return this.parent.find_nearest(selector);
    }
    get_static_attribute_value(name) {
        const attribute = this.attributes && this.attributes.find((attr) => attr.type === 'Attribute' && attr.name.toLowerCase() === name);
        if (!attribute)
            return null;
        if (attribute.is_true)
            return true;
        if (attribute.chunks.length === 0)
            return '';
        if (attribute.chunks.length === 1 && attribute.chunks[0].type === 'Text') {
            return attribute.chunks[0].data;
        }
        return null;
    }
    has_ancestor(type) {
        return this.parent ?
            this.parent.type === type || this.parent.has_ancestor(type) :
            false;
    }
}
exports.default = Node;