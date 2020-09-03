"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_action = void 0;
const code_red_1 = require("code-red");
function add_actions(block, target, actions) {
    actions.forEach(action => add_action(block, target, action));
}
exports.default = add_actions;
function add_action(block, target, action) {
    const { expression } = action;
    let snippet;
    let dependencies;
    if (expression) {
        snippet = expression.manipulate(block);
        dependencies = expression.dynamic_dependencies();
    }
    const id = block.get_unique_name(`${action.name.replace(/[^a-zA-Z0-9_$]/g, '_')}_action`);
    block.add_variable(id);
    const fn = block.renderer.reference(action.name);
    block.event_listeners.push(code_red_1.x `@action_destroyer(${id} = ${fn}.call(null, ${target}, ${snippet}))`);
    if (dependencies && dependencies.length > 0) {
        let condition = code_red_1.x `${id} && @is_function(${id}.update)`;
        if (dependencies.length > 0) {
            condition = code_red_1.x `${condition} && ${block.renderer.dirty(dependencies)}`;
        }
        block.chunks.update.push(code_red_1.b `if (${condition}) ${id}.update.call(null, ${snippet});`);
    }
}
exports.add_action = add_action;
