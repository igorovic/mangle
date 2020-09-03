"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const estree_walker_1 = require("estree-walker");
const is_reference_1 = __importDefault(require("is-reference"));
const flatten_reference_1 = __importDefault(require("../../utils/flatten_reference"));
const scope_1 = require("../../utils/scope");
const names_1 = require("../../../utils/names");
const get_object_1 = __importDefault(require("../../utils/get_object"));
const is_dynamic_1 = __importDefault(require("../../render_dom/wrappers/shared/is_dynamic"));
const code_red_1 = require("code-red");
const invalidate_1 = require("../../render_dom/invalidate");
const reserved_keywords_1 = require("../../utils/reserved_keywords");
const replace_object_1 = __importDefault(require("../../utils/replace_object"));
class Expression {
    // todo: owner type
    constructor(component, owner, template_scope, info, lazy) {
        this.type = 'Expression';
        this.references = new Set();
        this.dependencies = new Set();
        this.contextual_dependencies = new Set();
        this.declarations = [];
        this.uses_context = false;
        // TODO revert to direct property access in prod?
        Object.defineProperties(this, {
            component: {
                value: component
            }
        });
        this.node = info;
        this.template_scope = template_scope;
        this.owner = owner;
        const { dependencies, contextual_dependencies, references } = this;
        let { map, scope } = scope_1.create_scopes(info);
        this.scope = scope;
        this.scope_map = map;
        const expression = this;
        let function_expression;
        // discover dependencies, but don't change the code yet
        estree_walker_1.walk(info, {
            enter(node, parent, key) {
                // don't manipulate shorthand props twice
                if (key === 'value' && parent.shorthand)
                    return;
                if (map.has(node)) {
                    scope = map.get(node);
                }
                if (!function_expression && /FunctionExpression/.test(node.type)) {
                    function_expression = node;
                }
                if (is_reference_1.default(node, parent)) {
                    const { name, nodes } = flatten_reference_1.default(node);
                    references.add(name);
                    if (scope.has(name))
                        return;
                    if (name[0] === '$') {
                        const store_name = name.slice(1);
                        if (template_scope.names.has(store_name) || scope.has(store_name)) {
                            component.error(node, {
                                code: `contextual-store`,
                                message: `Stores must be declared at the top level of the component (this may change in a future version of Svelte)`
                            });
                        }
                    }
                    if (template_scope.is_let(name)) {
                        if (!function_expression) { // TODO should this be `!lazy` ?
                            contextual_dependencies.add(name);
                            dependencies.add(name);
                        }
                    }
                    else if (template_scope.names.has(name)) {
                        expression.uses_context = true;
                        contextual_dependencies.add(name);
                        const owner = template_scope.get_owner(name);
                        const is_index = owner.type === 'EachBlock' && owner.key && name === owner.index;
                        if (!lazy || is_index) {
                            template_scope.dependencies_for_name.get(name).forEach(name => dependencies.add(name));
                        }
                    }
                    else {
                        if (!lazy) {
                            dependencies.add(name);
                        }
                        component.add_reference(name);
                        component.warn_if_undefined(name, nodes[0], template_scope);
                    }
                    this.skip();
                }
                // track any assignments from template expressions as mutable
                let names;
                let deep = false;
                if (function_expression) {
                    if (node.type === 'AssignmentExpression') {
                        deep = node.left.type === 'MemberExpression';
                        names = scope_1.extract_names(deep ? get_object_1.default(node.left) : node.left);
                    }
                    else if (node.type === 'UpdateExpression') {
                        names = scope_1.extract_names(get_object_1.default(node.argument));
                    }
                }
                if (names) {
                    names.forEach(name => {
                        if (template_scope.names.has(name)) {
                            template_scope.dependencies_for_name.get(name).forEach(name => {
                                const variable = component.var_lookup.get(name);
                                if (variable)
                                    variable[deep ? 'mutated' : 'reassigned'] = true;
                            });
                            const each_block = template_scope.get_owner(name);
                            each_block.has_binding = true;
                        }
                        else {
                            component.add_reference(name);
                            const variable = component.var_lookup.get(name);
                            if (variable)
                                variable[deep ? 'mutated' : 'reassigned'] = true;
                        }
                    });
                }
            },
            leave(node) {
                if (map.has(node)) {
                    scope = scope.parent;
                }
                if (node === function_expression) {
                    function_expression = null;
                }
            }
        });
    }
    dynamic_dependencies() {
        return Array.from(this.dependencies).filter(name => {
            if (this.template_scope.is_let(name))
                return true;
            if (reserved_keywords_1.is_reserved_keyword(name))
                return true;
            const variable = this.component.var_lookup.get(name);
            return is_dynamic_1.default(variable);
        });
    }
    // TODO move this into a render-dom wrapper?
    manipulate(block) {
        // TODO ideally we wouldn't end up calling this method
        // multiple times
        if (this.manipulated)
            return this.manipulated;
        const { component, declarations, scope_map: map, template_scope, owner } = this;
        let scope = this.scope;
        let function_expression;
        let dependencies;
        let contextual_dependencies;
        const node = estree_walker_1.walk(this.node, {
            enter(node, parent) {
                if (node.type === 'Property' && node.shorthand) {
                    node.value = JSON.parse(JSON.stringify(node.value));
                    node.shorthand = false;
                }
                if (map.has(node)) {
                    scope = map.get(node);
                }
                if (node.type === 'Identifier' && is_reference_1.default(node, parent)) {
                    const { name } = flatten_reference_1.default(node);
                    if (scope.has(name))
                        return;
                    if (function_expression) {
                        if (template_scope.names.has(name)) {
                            contextual_dependencies.add(name);
                            template_scope.dependencies_for_name.get(name).forEach(dependency => {
                                dependencies.add(dependency);
                            });
                        }
                        else {
                            dependencies.add(name);
                            component.add_reference(name); // TODO is this redundant/misplaced?
                        }
                    }
                    else if (is_contextual(component, template_scope, name)) {
                        const reference = block.renderer.reference(node);
                        this.replace(reference);
                    }
                    this.skip();
                }
                if (!function_expression) {
                    if (node.type === 'AssignmentExpression') {
                        // TODO should this be a warning/error? `<p>{foo = 1}</p>`
                    }
                    if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
                        function_expression = node;
                        dependencies = new Set();
                        contextual_dependencies = new Set();
                    }
                }
            },
            leave(node, parent) {
                if (map.has(node))
                    scope = scope.parent;
                if (node === function_expression) {
                    const id = component.get_unique_name(names_1.sanitize(get_function_name(node, owner)));
                    const declaration = code_red_1.b `const ${id} = ${node}`;
                    if (dependencies.size === 0 && contextual_dependencies.size === 0) {
                        // we can hoist this out of the component completely
                        component.fully_hoisted.push(declaration);
                        this.replace(id);
                        component.add_var({
                            name: id.name,
                            internal: true,
                            hoistable: true,
                            referenced: true
                        });
                    }
                    else if (contextual_dependencies.size === 0) {
                        // function can be hoisted inside the component init
                        component.partly_hoisted.push(declaration);
                        block.renderer.add_to_context(id.name);
                        this.replace(block.renderer.reference(id));
                    }
                    else {
                        // we need a combo block/init recipe
                        const deps = Array.from(contextual_dependencies);
                        node.params = [
                            ...deps.map(name => ({ type: 'Identifier', name })),
                            ...node.params
                        ];
                        const context_args = deps.map(name => block.renderer.reference(name));
                        component.partly_hoisted.push(declaration);
                        block.renderer.add_to_context(id.name);
                        const callee = block.renderer.reference(id);
                        this.replace(id);
                        if (node.params.length > 0) {
                            declarations.push(code_red_1.b `
								function ${id}(...args) {
									return ${callee}(${context_args}, ...args);
								}
							`);
                        }
                        else {
                            declarations.push(code_red_1.b `
								function ${id}() {
									return ${callee}(${context_args});
								}
							`);
                        }
                    }
                    function_expression = null;
                    dependencies = null;
                    contextual_dependencies = null;
                    if (parent && parent.type === 'Property') {
                        parent.method = false;
                    }
                }
                if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
                    const assignee = node.type === 'AssignmentExpression' ? node.left : node.argument;
                    const object_name = get_object_1.default(assignee).name;
                    if (scope.has(object_name))
                        return;
                    // normally (`a = 1`, `b.c = 2`), there'll be a single name
                    // (a or b). In destructuring cases (`[d, e] = [e, d]`) there
                    // may be more, in which case we need to tack the extra ones
                    // onto the initial function call
                    const names = new Set(scope_1.extract_names(assignee));
                    const traced = new Set();
                    names.forEach(name => {
                        const dependencies = template_scope.dependencies_for_name.get(name);
                        if (dependencies) {
                            dependencies.forEach(name => traced.add(name));
                        }
                        else {
                            traced.add(name);
                        }
                    });
                    const context = block.bindings.get(object_name);
                    if (context) {
                        // for `{#each array as item}`
                        // replace `item = 1` to `each_array[each_index] = 1`, this allow us to mutate the array
                        // rather than mutating the local `item` variable
                        const { snippet, object, property } = context;
                        const replaced = replace_object_1.default(assignee, snippet);
                        if (node.type === 'AssignmentExpression') {
                            node.left = replaced;
                        }
                        else {
                            node.argument = replaced;
                        }
                        contextual_dependencies.add(object.name);
                        contextual_dependencies.add(property.name);
                    }
                    this.replace(invalidate_1.invalidate(block.renderer, scope, node, traced));
                }
            }
        });
        if (declarations.length > 0) {
            block.maintain_context = true;
            declarations.forEach(declaration => {
                block.chunks.init.push(declaration);
            });
        }
        return (this.manipulated = node);
    }
}
exports.default = Expression;
function get_function_name(_node, parent) {
    if (parent.type === 'EventHandler') {
        return `${parent.name}_handler`;
    }
    if (parent.type === 'Action') {
        return `${parent.name}_function`;
    }
    return 'func';
}
function is_contextual(component, scope, name) {
    if (reserved_keywords_1.is_reserved_keyword(name))
        return true;
    // if it's a name below root scope, it's contextual
    if (!scope.is_top_level(name))
        return true;
    const variable = component.var_lookup.get(name);
    // hoistables, module declarations, and imports are non-contextual
    if (!variable || variable.hoistable)
        return false;
    // assume contextual
    return true;
}
