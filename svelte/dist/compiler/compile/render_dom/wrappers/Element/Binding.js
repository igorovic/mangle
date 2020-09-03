"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const get_object_1 = __importDefault(require("../../../utils/get_object"));
const replace_object_1 = __importDefault(require("../../../utils/replace_object"));
const flatten_reference_1 = __importDefault(require("../../../utils/flatten_reference"));
const add_to_set_1 = __importDefault(require("../../../utils/add_to_set"));
const mark_each_block_bindings_1 = __importDefault(require("../shared/mark_each_block_bindings"));
const handle_select_value_binding_1 = __importDefault(require("./handle_select_value_binding"));
class BindingWrapper {
    constructor(block, node, parent) {
        this.node = node;
        this.parent = parent;
        const { dependencies } = this.node.expression;
        block.add_dependencies(dependencies);
        // TODO does this also apply to e.g. `<input type='checkbox' bind:group='foo'>`?
        handle_select_value_binding_1.default(this, dependencies);
        if (node.is_contextual) {
            mark_each_block_bindings_1.default(this.parent, this.node);
        }
        this.object = get_object_1.default(this.node.expression.node).name;
        // view to model
        this.handler = get_event_handler(this, parent.renderer, block, this.object, this.node.raw_expression);
        this.snippet = this.node.expression.manipulate(block);
        this.is_readonly = this.node.is_readonly;
        this.needs_lock = this.node.name === 'currentTime'; // TODO others?
    }
    get_dependencies() {
        const dependencies = new Set(this.node.expression.dependencies);
        this.node.expression.dependencies.forEach((prop) => {
            const indirect_dependencies = this.parent.renderer.component.indirect_dependencies.get(prop);
            if (indirect_dependencies) {
                indirect_dependencies.forEach(indirect_dependency => {
                    dependencies.add(indirect_dependency);
                });
            }
        });
        return dependencies;
    }
    is_readonly_media_attribute() {
        return this.node.is_readonly_media_attribute();
    }
    render(block, lock) {
        if (this.is_readonly)
            return;
        const { parent } = this;
        const update_conditions = this.needs_lock ? [code_red_1.x `!${lock}`] : [];
        const mount_conditions = [];
        const dependency_array = Array.from(this.get_dependencies());
        if (dependency_array.length > 0) {
            update_conditions.push(block.renderer.dirty(dependency_array));
        }
        if (parent.node.name === "input") {
            const type = parent.node.get_static_attribute_value("type");
            if (type === null ||
                type === "" ||
                type === "text" ||
                type === "email" ||
                type === "password") {
                update_conditions.push(code_red_1.x `${parent.var}.${this.node.name} !== ${this.snippet}`);
            }
            else if (type === "number") {
                update_conditions.push(code_red_1.x `@to_number(${parent.var}.${this.node.name}) !== ${this.snippet}`);
            }
        }
        // model to view
        let update_dom = get_dom_updater(parent, this);
        let mount_dom = update_dom;
        // special cases
        switch (this.node.name) {
            case 'group':
                {
                    const { binding_group, is_context, contexts, index } = get_binding_group(parent.renderer, this.node, block);
                    block.renderer.add_to_context(`$$binding_groups`);
                    if (is_context) {
                        if (contexts.length > 1) {
                            let binding_group = code_red_1.x `${block.renderer.reference('$$binding_groups')}[${index}]`;
                            for (const name of contexts.slice(0, -1)) {
                                binding_group = code_red_1.x `${binding_group}[${block.renderer.reference(name)}]`;
                                block.chunks.init.push(code_red_1.b `${binding_group} = ${binding_group} || [];`);
                            }
                        }
                        block.chunks.init.push(code_red_1.b `${binding_group(true)} = [];`);
                    }
                    block.chunks.hydrate.push(code_red_1.b `${binding_group(true)}.push(${parent.var});`);
                    block.chunks.destroy.push(code_red_1.b `${binding_group(true)}.splice(${binding_group(true)}.indexOf(${parent.var}), 1);`);
                    break;
                }
            case 'textContent':
                update_conditions.push(code_red_1.x `${this.snippet} !== ${parent.var}.textContent`);
                mount_conditions.push(code_red_1.x `${this.snippet} !== void 0`);
                break;
            case 'innerHTML':
                update_conditions.push(code_red_1.x `${this.snippet} !== ${parent.var}.innerHTML`);
                mount_conditions.push(code_red_1.x `${this.snippet} !== void 0`);
                break;
            case 'currentTime':
                update_conditions.push(code_red_1.x `!@_isNaN(${this.snippet})`);
                mount_dom = null;
                break;
            case 'playbackRate':
            case 'volume':
                update_conditions.push(code_red_1.x `!@_isNaN(${this.snippet})`);
                mount_conditions.push(code_red_1.x `!@_isNaN(${this.snippet})`);
                break;
            case 'paused':
                {
                    // this is necessary to prevent audio restarting by itself
                    const last = block.get_unique_name(`${parent.var.name}_is_paused`);
                    block.add_variable(last, code_red_1.x `true`);
                    update_conditions.push(code_red_1.x `${last} !== (${last} = ${this.snippet})`);
                    update_dom = code_red_1.b `${parent.var}[${last} ? "pause" : "play"]();`;
                    mount_dom = null;
                    break;
                }
            case 'value':
                if (parent.node.get_static_attribute_value('type') === 'file') {
                    update_dom = null;
                    mount_dom = null;
                }
        }
        if (update_dom) {
            if (update_conditions.length > 0) {
                const condition = update_conditions.reduce((lhs, rhs) => code_red_1.x `${lhs} && ${rhs}`);
                block.chunks.update.push(code_red_1.b `
					if (${condition}) {
						${update_dom}
					}
				`);
            }
            else {
                block.chunks.update.push(update_dom);
            }
        }
        if (mount_dom) {
            if (mount_conditions.length > 0) {
                const condition = mount_conditions.reduce((lhs, rhs) => code_red_1.x `${lhs} && ${rhs}`);
                block.chunks.mount.push(code_red_1.b `
					if (${condition}) {
						${mount_dom}
					}
				`);
            }
            else {
                block.chunks.mount.push(mount_dom);
            }
        }
    }
}
exports.default = BindingWrapper;
function get_dom_updater(element, binding) {
    const { node } = element;
    if (binding.is_readonly_media_attribute()) {
        return null;
    }
    if (binding.node.name === 'this') {
        return null;
    }
    if (node.name === 'select') {
        return node.get_static_attribute_value('multiple') === true ?
            code_red_1.b `@select_options(${element.var}, ${binding.snippet})` :
            code_red_1.b `@select_option(${element.var}, ${binding.snippet})`;
    }
    if (binding.node.name === 'group') {
        const type = node.get_static_attribute_value('type');
        const condition = type === 'checkbox'
            ? code_red_1.x `~${binding.snippet}.indexOf(${element.var}.__value)`
            : code_red_1.x `${element.var}.__value === ${binding.snippet}`;
        return code_red_1.b `${element.var}.checked = ${condition};`;
    }
    if (binding.node.name === 'value') {
        return code_red_1.b `@set_input_value(${element.var}, ${binding.snippet});`;
    }
    return code_red_1.b `${element.var}.${binding.node.name} = ${binding.snippet};`;
}
function get_binding_group(renderer, value, block) {
    const { parts } = flatten_reference_1.default(value.raw_expression);
    let keypath = parts.join('.');
    const contexts = [];
    for (const dep of value.expression.contextual_dependencies) {
        const context = block.bindings.get(dep);
        let key;
        let name;
        if (context) {
            key = context.object.name;
            name = context.property.name;
        }
        else {
            key = dep;
            name = dep;
        }
        keypath = `${key}@${keypath}`;
        contexts.push(name);
    }
    if (!renderer.binding_groups.has(keypath)) {
        const index = renderer.binding_groups.size;
        contexts.forEach(context => {
            renderer.add_to_context(context, true);
        });
        renderer.binding_groups.set(keypath, {
            binding_group: (to_reference = false) => {
                let binding_group = '$$binding_groups';
                let _secondary_indexes = contexts;
                if (to_reference) {
                    binding_group = block.renderer.reference(binding_group);
                    _secondary_indexes = _secondary_indexes.map(name => block.renderer.reference(name));
                }
                if (_secondary_indexes.length > 0) {
                    let obj = code_red_1.x `${binding_group}[${index}]`;
                    _secondary_indexes.forEach(secondary_index => {
                        obj = code_red_1.x `${obj}[${secondary_index}]`;
                    });
                    return obj;
                }
                else {
                    return code_red_1.x `${binding_group}[${index}]`;
                }
            },
            is_context: contexts.length > 0,
            contexts,
            index
        });
    }
    return renderer.binding_groups.get(keypath);
}
function get_event_handler(binding, renderer, block, name, lhs) {
    const contextual_dependencies = new Set(binding.node.expression.contextual_dependencies);
    const context = block.bindings.get(name);
    let set_store;
    if (context) {
        const { object, property, store, snippet } = context;
        lhs = replace_object_1.default(lhs, snippet);
        contextual_dependencies.add(object.name);
        contextual_dependencies.add(property.name);
        contextual_dependencies.delete(name);
        if (store) {
            set_store = code_red_1.b `${store}.set(${`$${store}`});`;
        }
    }
    else {
        const object = get_object_1.default(lhs);
        if (object.name[0] === '$') {
            const store = object.name.slice(1);
            set_store = code_red_1.b `${store}.set(${object.name});`;
        }
    }
    const value = get_value_from_dom(renderer, binding.parent, binding, block, contextual_dependencies);
    const mutation = code_red_1.b `
		${lhs} = ${value};
		${set_store}
	`;
    return {
        uses_context: binding.node.is_contextual || binding.node.expression.uses_context,
        mutation,
        contextual_dependencies,
        lhs
    };
}
function get_value_from_dom(renderer, element, binding, block, contextual_dependencies) {
    const { node } = element;
    const { name } = binding.node;
    if (name === 'this') {
        return code_red_1.x `$$value`;
    }
    // <select bind:value='selected>
    if (node.name === 'select') {
        return node.get_static_attribute_value('multiple') === true ?
            code_red_1.x `@select_multiple_value(this)` :
            code_red_1.x `@select_value(this)`;
    }
    const type = node.get_static_attribute_value('type');
    // <input type='checkbox' bind:group='foo'>
    if (name === 'group') {
        if (type === 'checkbox') {
            const { binding_group, contexts } = get_binding_group(renderer, binding.node, block);
            add_to_set_1.default(contextual_dependencies, contexts);
            return code_red_1.x `@get_binding_group_value(${binding_group()}, this.__value, this.checked)`;
        }
        return code_red_1.x `this.__value`;
    }
    // <input type='range|number' bind:value>
    if (type === 'range' || type === 'number') {
        return code_red_1.x `@to_number(this.${name})`;
    }
    if ((name === 'buffered' || name === 'seekable' || name === 'played')) {
        return code_red_1.x `@time_ranges_to_array(this.${name})`;
    }
    // everything else
    return code_red_1.x `this.${name}`;
}
