"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    if (!options.dev)
        return;
    const filename = options.filename || null;
    const { line, column } = options.locate(node.start + 1);
    const obj = code_red_1.x `{
		${node.expressions.map(e => code_red_1.p `${e.node.name}`)}
	}`;
    renderer.add_expression(code_red_1.x `@debug(${filename ? code_red_1.x `"${filename}"` : code_red_1.x `null`}, ${line - 1}, ${column}, ${obj})`);
}
exports.default = default_1;
