"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stringify_1 = require("../../utils/stringify");
const get_slot_scope_1 = require("./shared/get_slot_scope");
const remove_whitespace_children_1 = __importDefault(require("./utils/remove_whitespace_children"));
const code_red_1 = require("code-red");
function get_prop_value(attribute) {
    if (attribute.is_true)
        return code_red_1.x `true`;
    if (attribute.chunks.length === 0)
        return code_red_1.x `''`;
    return attribute.chunks
        .map(chunk => {
        if (chunk.type === 'Text')
            return stringify_1.string_literal(chunk.data);
        return chunk.node;
    })
        .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
}
function default_1(node, renderer, options) {
    const binding_props = [];
    const binding_fns = [];
    node.bindings.forEach(binding => {
        renderer.has_bindings = true;
        // TODO this probably won't work for contextual bindings
        const snippet = binding.expression.node;
        binding_props.push(code_red_1.p `${binding.name}: ${snippet}`);
        binding_fns.push(code_red_1.p `${binding.name}: $$value => { ${snippet} = $$value; $$settled = false }`);
    });
    const uses_spread = node.attributes.find(attr => attr.is_spread);
    let props;
    if (uses_spread) {
        props = code_red_1.x `@_Object.assign(${node.attributes
            .map(attribute => {
            if (attribute.is_spread) {
                return attribute.expression.node;
            }
            else {
                return code_red_1.x `{ ${attribute.name}: ${get_prop_value(attribute)} }`;
            }
        })
            .concat(binding_props.map(p => code_red_1.x `{ ${p} }`))})`;
    }
    else {
        props = code_red_1.x `{
			${node.attributes.map(attribute => code_red_1.p `${attribute.name}: ${get_prop_value(attribute)}`)},
			${binding_props}
		}`;
    }
    const bindings = code_red_1.x `{
		${binding_fns}
	}`;
    const expression = (node.name === 'svelte:self'
        ? renderer.name
        : node.name === 'svelte:component'
            ? code_red_1.x `(${node.expression.node}) || @missing_component`
            : node.name.split('.').reduce(((lhs, rhs) => code_red_1.x `${lhs}.${rhs}`)));
    const slot_fns = [];
    const children = remove_whitespace_children_1.default(node.children, node.next);
    if (children.length) {
        const slot_scopes = new Map();
        renderer.push();
        renderer.render(children, Object.assign({}, options, {
            slot_scopes
        }));
        slot_scopes.set('default', {
            input: get_slot_scope_1.get_slot_scope(node.lets),
            output: renderer.pop()
        });
        slot_scopes.forEach(({ input, output }, name) => {
            if (!is_empty_template_literal(output)) {
                slot_fns.push(code_red_1.p `${name}: (${input}) => ${output}`);
            }
        });
    }
    const slots = code_red_1.x `{
		${slot_fns}
	}`;
    renderer.add_expression(code_red_1.x `@validate_component(${expression}, "${node.name}").$$render($$result, ${props}, ${bindings}, ${slots})`);
}
exports.default = default_1;
function is_empty_template_literal(template_literal) {
    return (template_literal.expressions.length === 0 &&
        template_literal.quasis.length === 1 &&
        template_literal.quasis[0].value.raw === "");
}
