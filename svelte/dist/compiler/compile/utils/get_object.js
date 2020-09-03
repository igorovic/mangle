"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function get_object(node) {
    while (node.type === 'MemberExpression')
        node = node.object;
    return node;
}
exports.default = get_object;
