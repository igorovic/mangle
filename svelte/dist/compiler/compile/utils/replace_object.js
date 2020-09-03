"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function replace_object(node, replacement) {
    if (node.type === 'Identifier')
        return replacement;
    const ancestor = node;
    let parent;
    while (node.type === 'MemberExpression') {
        parent = node;
        node = node.object;
    }
    parent.object = replacement;
    return ancestor;
}
exports.default = replace_object;
