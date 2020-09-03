"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function handle_select_value_binding(attr, dependencies) {
    const { parent } = attr;
    if (parent.node.name === "select") {
        parent.select_binding_dependencies = dependencies;
        dependencies.forEach((prop) => {
            parent.renderer.component.indirect_dependencies.set(prop, new Set());
        });
    }
}
exports.default = handle_select_value_binding;
