"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const names_1 = require("../../../utils/names");
const get_attribute_value_1 = require("./shared/get_attribute_value");
const get_slot_scope_1 = require("./shared/get_slot_scope");
const boolean_attributes_1 = require("./shared/boolean_attributes");
const code_red_1 = require("code-red");
const remove_whitespace_children_1 = __importDefault(require("./utils/remove_whitespace_children"));
function default_1(node, renderer, options) {
    const children = remove_whitespace_children_1.default(node.children, node.next);
    // awkward special case
    let node_contents;
    const contenteditable = (node.name !== 'textarea' &&
        node.name !== 'input' &&
        node.attributes.some((attribute) => attribute.name === 'contenteditable'));
    const slot = node.get_static_attribute_value('slot');
    const nearest_inline_component = node.find_nearest(/InlineComponent/);
    if (slot && nearest_inline_component) {
        renderer.push();
    }
    renderer.add_string(`<${node.name}`);
    const class_expression_list = node.classes.map(class_directive => {
        const { expression, name } = class_directive;
        const snippet = expression ? expression.node : code_red_1.x `#ctx.${name}`; // TODO is this right?
        return code_red_1.x `${snippet} ? "${name}" : ""`;
    });
    if (node.needs_manual_style_scoping) {
        class_expression_list.push(code_red_1.x `"${node.component.stylesheet.id}"`);
    }
    const class_expression = class_expression_list.length > 0 &&
        class_expression_list.reduce((lhs, rhs) => code_red_1.x `${lhs} + ' ' + ${rhs}`);
    if (node.attributes.some(attr => attr.is_spread)) {
        // TODO dry this out
        const args = [];
        node.attributes.forEach(attribute => {
            if (attribute.is_spread) {
                args.push(attribute.expression.node);
            }
            else {
                const name = attribute.name.toLowerCase();
                if (name === 'value' && node.name.toLowerCase() === 'textarea') {
                    node_contents = get_attribute_value_1.get_attribute_value(attribute);
                }
                else if (attribute.is_true) {
                    args.push(code_red_1.x `{ ${attribute.name}: true }`);
                }
                else if (boolean_attributes_1.boolean_attributes.has(name) &&
                    attribute.chunks.length === 1 &&
                    attribute.chunks[0].type !== 'Text') {
                    // a boolean attribute with one non-Text chunk
                    args.push(code_red_1.x `{ ${attribute.name}: ${attribute.chunks[0].node} || null }`);
                }
                else {
                    args.push(code_red_1.x `{ ${attribute.name}: ${get_attribute_value_1.get_attribute_value(attribute)} }`);
                }
            }
        });
        renderer.add_expression(code_red_1.x `@spread([${args}], ${class_expression})`);
    }
    else {
        let add_class_attribute = !!class_expression;
        node.attributes.forEach(attribute => {
            const name = attribute.name.toLowerCase();
            if (name === 'value' && node.name.toLowerCase() === 'textarea') {
                node_contents = get_attribute_value_1.get_attribute_value(attribute);
            }
            else if (attribute.is_true) {
                renderer.add_string(` ${attribute.name}`);
            }
            else if (boolean_attributes_1.boolean_attributes.has(name) &&
                attribute.chunks.length === 1 &&
                attribute.chunks[0].type !== 'Text') {
                // a boolean attribute with one non-Text chunk
                renderer.add_string(` `);
                renderer.add_expression(code_red_1.x `${attribute.chunks[0].node} ? "${attribute.name}" : ""`);
            }
            else if (name === 'class' && class_expression) {
                add_class_attribute = false;
                renderer.add_string(` ${attribute.name}="`);
                renderer.add_expression(code_red_1.x `[${get_attribute_value_1.get_class_attribute_value(attribute)}, ${class_expression}].join(' ').trim()`);
                renderer.add_string(`"`);
            }
            else if (attribute.chunks.length === 1 && attribute.chunks[0].type !== 'Text') {
                const snippet = attribute.chunks[0].node;
                renderer.add_expression(code_red_1.x `@add_attribute("${attribute.name}", ${snippet}, ${boolean_attributes_1.boolean_attributes.has(name) ? 1 : 0})`);
            }
            else {
                renderer.add_string(` ${attribute.name}="`);
                renderer.add_expression((name === 'class' ? get_attribute_value_1.get_class_attribute_value : get_attribute_value_1.get_attribute_value)(attribute));
                renderer.add_string(`"`);
            }
        });
        if (add_class_attribute) {
            renderer.add_expression(code_red_1.x `@add_classes([${class_expression}].join(' ').trim())`);
        }
    }
    node.bindings.forEach(binding => {
        const { name, expression } = binding;
        if (binding.is_readonly) {
            return;
        }
        if (name === 'group') {
            // TODO server-render group bindings
        }
        else if (contenteditable && (name === 'textContent' || name === 'innerHTML')) {
            node_contents = expression.node;
            // TODO where was this used?
            // value = name === 'textContent' ? x`@escape($$value)` : x`$$value`;
        }
        else if (binding.name === 'value' && node.name === 'textarea') {
            const snippet = expression.node;
            node_contents = code_red_1.x `${snippet} || ""`;
        }
        else {
            const snippet = expression.node;
            renderer.add_expression(code_red_1.x `@add_attribute("${name}", ${snippet}, 1)`);
        }
    });
    if (options.hydratable && options.head_id) {
        renderer.add_string(` data-svelte="${options.head_id}"`);
    }
    renderer.add_string('>');
    if (node_contents !== undefined) {
        if (contenteditable) {
            renderer.push();
            renderer.render(children, options);
            const result = renderer.pop();
            renderer.add_expression(code_red_1.x `($$value => $$value === void 0 ? ${result} : $$value)(${node_contents})`);
        }
        else {
            renderer.add_expression(node_contents);
        }
        if (!names_1.is_void(node.name)) {
            renderer.add_string(`</${node.name}>`);
        }
    }
    else if (slot && nearest_inline_component) {
        renderer.render(children, options);
        if (!names_1.is_void(node.name)) {
            renderer.add_string(`</${node.name}>`);
        }
        const lets = node.lets;
        const seen = new Set(lets.map(l => l.name.name));
        nearest_inline_component.lets.forEach(l => {
            if (!seen.has(l.name.name))
                lets.push(l);
        });
        options.slot_scopes.set(slot, {
            input: get_slot_scope_1.get_slot_scope(node.lets),
            output: renderer.pop()
        });
    }
    else {
        renderer.render(children, options);
        if (!names_1.is_void(node.name)) {
            renderer.add_string(`</${node.name}>`);
        }
    }
}
exports.default = default_1;
