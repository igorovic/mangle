"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TemplateScope {
    constructor(parent) {
        this.owners = new Map();
        this.parent = parent;
        this.names = new Set(parent ? parent.names : []);
        this.dependencies_for_name = new Map(parent ? parent.dependencies_for_name : []);
    }
    add(name, dependencies, owner) {
        this.names.add(name);
        this.dependencies_for_name.set(name, dependencies);
        this.owners.set(name, owner);
        return this;
    }
    child() {
        const child = new TemplateScope(this);
        return child;
    }
    is_top_level(name) {
        return !this.parent || !this.names.has(name) && this.parent.is_top_level(name);
    }
    get_owner(name) {
        return this.owners.get(name) || (this.parent && this.parent.get_owner(name));
    }
    is_let(name) {
        const owner = this.get_owner(name);
        return owner && (owner.type === 'Element' || owner.type === 'InlineComponent');
    }
    is_await(name) {
        const owner = this.get_owner(name);
        return owner && (owner.type === 'ThenBlock' || owner.type === 'CatchBlock');
    }
}
exports.default = TemplateScope;
