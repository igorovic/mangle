"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const stringify_1 = require("./stringify");
function get_slot_data(values, block = null) {
    return {
        type: 'ObjectExpression',
        properties: Array.from(values.values())
            .filter(attribute => attribute.name !== 'name')
            .map(attribute => {
            const value = get_value(block, attribute);
            return code_red_1.p `${attribute.name}: ${value}`;
        })
    };
}
exports.default = get_slot_data;
function get_value(block, attribute) {
    if (attribute.is_true)
        return code_red_1.x `true`;
    if (attribute.chunks.length === 0)
        return code_red_1.x `""`;
    let value = attribute.chunks
        .map(chunk => chunk.type === 'Text' ? stringify_1.string_literal(chunk.data) : (block ? chunk.manipulate(block) : chunk.node))
        .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
    if (attribute.chunks.length > 1 && attribute.chunks[0].type !== 'Text') {
        value = code_red_1.x `"" + ${value}`;
    }
    return value;
}
