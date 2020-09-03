"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    const head_options = Object.assign(Object.assign({}, options), { head_id: node.id });
    renderer.push();
    renderer.render(node.children, head_options);
    const result = renderer.pop();
    renderer.add_expression(code_red_1.x `$$result.head += ${result}, ""`);
}
exports.default = default_1;
