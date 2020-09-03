"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidate = void 0;
const nodes_match_1 = require("../../utils/nodes_match");
const code_red_1 = require("code-red");
function invalidate(renderer, scope, node, names, main_execution_context = false) {
    const { component } = renderer;
    const [head, ...tail] = Array.from(names)
        .filter(name => {
        const owner = scope.find_owner(name);
        return !owner || owner === component.instance_scope;
    })
        .map(name => component.var_lookup.get(name))
        .filter(variable => {
        return variable && (!variable.hoistable &&
            !variable.global &&
            !variable.module &&
            (variable.referenced ||
                variable.subscribable ||
                variable.is_reactive_dependency ||
                variable.export_name ||
                variable.name[0] === '$'));
    });
    function get_invalidated(variable, node) {
        if (main_execution_context && !variable.subscribable && variable.name[0] !== '$') {
            return node || code_red_1.x `${variable.name}`;
        }
        return renderer.invalidate(variable.name);
    }
    if (head) {
        component.has_reactive_assignments = true;
        if (node.type === 'AssignmentExpression' && node.operator === '=' && nodes_match_1.nodes_match(node.left, node.right) && tail.length === 0) {
            return get_invalidated(head, node);
        }
        else {
            const is_store_value = head.name[0] === '$' && head.name[1] !== '$';
            const extra_args = tail.map(variable => get_invalidated(variable));
            const pass_value = (extra_args.length > 0 ||
                (node.type === 'AssignmentExpression' && node.left.type !== 'Identifier') ||
                (node.type === 'UpdateExpression' && (!node.prefix || node.argument.type !== 'Identifier')));
            if (pass_value) {
                extra_args.unshift({
                    type: 'Identifier',
                    name: head.name
                });
            }
            let invalidate = is_store_value
                ? code_red_1.x `@set_store_value(${head.name.slice(1)}, ${node}, ${extra_args})`
                : !main_execution_context
                    ? code_red_1.x `$$invalidate(${renderer.context_lookup.get(head.name).index}, ${node}, ${extra_args})`
                    : node;
            if (head.subscribable && head.reassigned) {
                const subscribe = `$$subscribe_${head.name}`;
                invalidate = code_red_1.x `${subscribe}(${invalidate})`;
            }
            return invalidate;
        }
    }
    return node;
}
exports.invalidate = invalidate;
