"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    const condition = node.expression.node;
    renderer.push();
    renderer.render(node.children, options);
    const consequent = renderer.pop();
    renderer.push();
    if (node.else)
        renderer.render(node.else.children, options);
    const alternate = renderer.pop();
    renderer.add_expression(code_red_1.x `${condition} ? ${consequent} : ${alternate}`);
}
exports.default = default_1;
