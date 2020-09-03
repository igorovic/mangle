"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const get_object_1 = __importDefault(require("../utils/get_object"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const patterns_1 = require("../../utils/patterns");
// TODO this should live in a specific binding
const read_only_media_attributes = new Set([
    'duration',
    'buffered',
    'seekable',
    'played',
    'seeking',
    'ended',
    'videoHeight',
    'videoWidth'
]);
class Binding extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        if (info.expression.type !== 'Identifier' && info.expression.type !== 'MemberExpression') {
            component.error(info, {
                code: 'invalid-directive-value',
                message: 'Can only bind to an identifier (e.g. `foo`) or a member expression (e.g. `foo.bar` or `foo[baz]`)'
            });
        }
        this.name = info.name;
        this.expression = new Expression_1.default(component, this, scope, info.expression);
        this.raw_expression = JSON.parse(JSON.stringify(info.expression));
        const { name } = get_object_1.default(this.expression.node);
        this.is_contextual = Array.from(this.expression.references).some(name => scope.names.has(name));
        // make sure we track this as a mutable ref
        if (scope.is_let(name)) {
            component.error(this, {
                code: 'invalid-binding',
                message: 'Cannot bind to a variable declared with the let: directive'
            });
        }
        else if (scope.names.has(name)) {
            if (scope.is_await(name)) {
                component.error(this, {
                    code: 'invalid-binding',
                    message: 'Cannot bind to a variable declared with {#await ... then} or {:catch} blocks'
                });
            }
            scope.dependencies_for_name.get(name).forEach(name => {
                const variable = component.var_lookup.get(name);
                if (variable) {
                    variable.mutated = true;
                }
            });
        }
        else {
            const variable = component.var_lookup.get(name);
            if (!variable || variable.global)
                component.error(this.expression.node, {
                    code: 'binding-undeclared',
                    message: `${name} is not declared`
                });
            variable[this.expression.node.type === 'MemberExpression' ? 'mutated' : 'reassigned'] = true;
            if (info.expression.type === 'Identifier' && !variable.writable)
                component.error(this.expression.node, {
                    code: 'invalid-binding',
                    message: 'Cannot bind to a variable which is not writable'
                });
        }
        const type = parent.get_static_attribute_value('type');
        this.is_readonly = (patterns_1.dimensions.test(this.name) ||
            (parent.is_media_node && parent.is_media_node() && read_only_media_attributes.has(this.name)) ||
            (parent.name === 'input' && type === 'file') // TODO others?
        );
    }
    is_readonly_media_attribute() {
        return read_only_media_attributes.has(this.name);
    }
}
exports.default = Binding;
