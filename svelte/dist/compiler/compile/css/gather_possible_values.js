"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gather_possible_values = exports.UNKNOWN = void 0;
exports.UNKNOWN = {};
function gather_possible_values(node, set) {
    if (node.type === 'Literal') {
        set.add(node.value);
    }
    else if (node.type === 'ConditionalExpression') {
        gather_possible_values(node.consequent, set);
        gather_possible_values(node.alternate, set);
    }
    else {
        set.add(exports.UNKNOWN);
    }
}
exports.gather_possible_values = gather_possible_values;
