"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Attribute_1 = __importDefault(require("./Attribute"));
const map_children_1 = __importDefault(require("./shared/map_children"));
const Binding_1 = __importDefault(require("./Binding"));
const EventHandler_1 = __importDefault(require("./EventHandler"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const Let_1 = __importDefault(require("./Let"));
class InlineComponent extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.attributes = [];
        this.bindings = [];
        this.handlers = [];
        this.lets = [];
        if (info.name !== 'svelte:component' && info.name !== 'svelte:self') {
            const name = info.name.split('.')[0]; // accommodate namespaces
            component.warn_if_undefined(name, info, scope);
            component.add_reference(name);
        }
        this.name = info.name;
        this.expression = this.name === 'svelte:component'
            ? new Expression_1.default(component, this, scope, info.expression)
            : null;
        info.attributes.forEach(node => {
            /* eslint-disable no-fallthrough */
            switch (node.type) {
                case 'Action':
                    component.error(node, {
                        code: `invalid-action`,
                        message: `Actions can only be applied to DOM elements, not components`
                    });
                case 'Attribute':
                    if (node.name === 'slot') {
                        component.error(node, {
                            code: `invalid-prop`,
                            message: `'slot' is reserved for future use in named slots`
                        });
                    }
                // fallthrough
                case 'Spread':
                    this.attributes.push(new Attribute_1.default(component, this, scope, node));
                    break;
                case 'Binding':
                    this.bindings.push(new Binding_1.default(component, this, scope, node));
                    break;
                case 'Class':
                    component.error(node, {
                        code: `invalid-class`,
                        message: `Classes can only be applied to DOM elements, not components`
                    });
                case 'EventHandler':
                    this.handlers.push(new EventHandler_1.default(component, this, scope, node));
                    break;
                case 'Let':
                    this.lets.push(new Let_1.default(component, this, scope, node));
                    break;
                case 'Transition':
                    component.error(node, {
                        code: `invalid-transition`,
                        message: `Transitions can only be applied to DOM elements, not components`
                    });
                default:
                    throw new Error(`Not implemented: ${node.type}`);
            }
            /* eslint-enable no-fallthrough */
        });
        if (this.lets.length > 0) {
            this.scope = scope.child();
            this.lets.forEach(l => {
                const dependencies = new Set([l.name.name]);
                l.names.forEach(name => {
                    this.scope.add(name, dependencies, this);
                });
            });
        }
        else {
            this.scope = scope;
        }
        this.handlers.forEach(handler => {
            handler.modifiers.forEach(modifier => {
                if (modifier !== 'once') {
                    component.error(handler, {
                        code: 'invalid-event-modifier',
                        message: `Event modifiers other than 'once' can only be used on DOM elements`
                    });
                }
            });
        });
        this.children = map_children_1.default(component, this, this.scope, info.children);
    }
}
exports.default = InlineComponent;
