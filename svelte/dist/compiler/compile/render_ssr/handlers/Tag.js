"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, _options) {
    const snippet = node.expression.node;
    renderer.add_expression(node.parent &&
        node.parent.type === 'Element' &&
        node.parent.name === 'style'
        ? snippet
        : code_red_1.x `@escape(${snippet})`);
}
exports.default = default_1;
