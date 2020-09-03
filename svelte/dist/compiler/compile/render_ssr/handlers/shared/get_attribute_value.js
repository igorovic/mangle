"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_attribute_value = exports.get_class_attribute_value = void 0;
const stringify_1 = require("../../../utils/stringify");
const code_red_1 = require("code-red");
function get_class_attribute_value(attribute) {
    // handle special case — `class={possiblyUndefined}` with scoped CSS
    if (attribute.chunks.length === 2 && attribute.chunks[1].synthetic) {
        const value = attribute.chunks[0].node;
        return code_red_1.x `@escape(@null_to_empty(${value})) + "${attribute.chunks[1].data}"`;
    }
    return get_attribute_value(attribute);
}
exports.get_class_attribute_value = get_class_attribute_value;
function get_attribute_value(attribute) {
    if (attribute.chunks.length === 0)
        return code_red_1.x `""`;
    return attribute.chunks
        .map((chunk) => {
        return chunk.type === 'Text'
            ? stringify_1.string_literal(chunk.data.replace(/"/g, '&quot;'))
            : code_red_1.x `@escape(${chunk.node})`;
    })
        .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
}
exports.get_attribute_value = get_attribute_value;
