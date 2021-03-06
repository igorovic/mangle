"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function mark_each_block_bindings(parent, binding) {
    // we need to ensure that the each block creates a context including
    // the list and the index, if they're not otherwise referenced
    binding.expression.references.forEach(name => {
        const each_block = parent.node.scope.get_owner(name);
        if (each_block) {
            each_block.has_binding = true;
        }
    });
    if (binding.name === "group") {
        // for `<input bind:group={} >`, we make sure that all the each blocks creates context with `index`
        for (const name of binding.expression.contextual_dependencies) {
            const each_block = parent.node.scope.get_owner(name);
            each_block.has_index_binding = true;
        }
    }
}
exports.default = mark_each_block_bindings;
