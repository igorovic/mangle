"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    renderer.push();
    renderer.add_string(`<title>`);
    renderer.render(node.children, options);
    renderer.add_string(`</title>`);
    const result = renderer.pop();
    renderer.add_expression(code_red_1.x `$$result.title = ${result}, ""`);
}
exports.default = default_1;
