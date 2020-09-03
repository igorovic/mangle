"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is_head = void 0;
function is_head(node) {
    return node && node.type === 'MemberExpression' && node.object.name === '@_document' && node.property.name === 'head';
}
exports.is_head = is_head;
