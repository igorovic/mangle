"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const get_slot_data_1 = __importDefault(require("../../utils/get_slot_data"));
function default_1(node, renderer, options) {
    const slot_data = get_slot_data_1.default(node.values);
    renderer.push();
    renderer.render(node.children, options);
    const result = renderer.pop();
    renderer.add_expression(code_red_1.x `
		#slots.${node.slot_name}
			? #slots.${node.slot_name}(${slot_data})
			: ${result}
	`);
}
exports.default = default_1;
