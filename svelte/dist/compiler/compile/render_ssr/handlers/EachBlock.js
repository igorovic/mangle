"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    const args = [node.context_node];
    if (node.index)
        args.push({ type: 'Identifier', name: node.index });
    renderer.push();
    renderer.render(node.children, options);
    const result = renderer.pop();
    const consequent = code_red_1.x `@each(${node.expression.node}, (${args}) => ${result})`;
    if (node.else) {
        renderer.push();
        renderer.render(node.else.children, options);
        const alternate = renderer.pop();
        renderer.add_expression(code_red_1.x `${node.expression.node}.length ? ${consequent} : ${alternate}`);
    }
    else {
        renderer.add_expression(consequent);
    }
}
exports.default = default_1;
