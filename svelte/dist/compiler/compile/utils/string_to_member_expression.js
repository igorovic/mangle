"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.string_to_member_expression = void 0;
function string_to_member_expression(name) {
    const parts = name.split(".");
    let node = {
        type: "Identifier",
        name: parts[0]
    };
    for (let i = 1; i < parts.length; i++) {
        node = {
            type: "MemberExpression",
            object: node,
            property: { type: "Identifier", name: parts[i] }
        };
    }
    return node;
}
exports.string_to_member_expression = string_to_member_expression;
