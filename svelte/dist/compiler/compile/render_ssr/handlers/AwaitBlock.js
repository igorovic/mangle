"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
function default_1(node, renderer, options) {
    renderer.push();
    renderer.render(node.pending.children, options);
    const pending = renderer.pop();
    renderer.push();
    renderer.render(node.then.children, options);
    const then = renderer.pop();
    renderer.add_expression(code_red_1.x `
		function(__value) {
			if (@is_promise(__value)) return ${pending};
			return (function(${node.then_node ? node.then_node : ''}) { return ${then}; }(__value));
		}(${node.expression.node})
	`);
}
exports.default = default_1;
