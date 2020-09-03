"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Binding_1 = __importDefault(require("./Binding"));
const EventHandler_1 = __importDefault(require("./EventHandler"));
const flatten_reference_1 = __importDefault(require("../utils/flatten_reference"));
const fuzzymatch_1 = __importDefault(require("../../utils/fuzzymatch"));
const list_1 = __importDefault(require("../../utils/list"));
const Action_1 = __importDefault(require("./Action"));
const valid_bindings = [
    'innerWidth',
    'innerHeight',
    'outerWidth',
    'outerHeight',
    'scrollX',
    'scrollY',
    'online'
];
class Window extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.handlers = [];
        this.bindings = [];
        this.actions = [];
        info.attributes.forEach(node => {
            if (node.type === 'EventHandler') {
                this.handlers.push(new EventHandler_1.default(component, this, scope, node));
            }
            else if (node.type === 'Binding') {
                if (node.expression.type !== 'Identifier') {
                    const { parts } = flatten_reference_1.default(node.expression);
                    // TODO is this constraint necessary?
                    component.error(node.expression, {
                        code: `invalid-binding`,
                        message: `Bindings on <svelte:window> must be to top-level properties, e.g. '${parts[parts.length - 1]}' rather than '${parts.join('.')}'`
                    });
                }
                if (!~valid_bindings.indexOf(node.name)) {
                    const match = (node.name === 'width' ? 'innerWidth' :
                        node.name === 'height' ? 'innerHeight' :
                            fuzzymatch_1.default(node.name, valid_bindings));
                    const message = `'${node.name}' is not a valid binding on <svelte:window>`;
                    if (match) {
                        component.error(node, {
                            code: `invalid-binding`,
                            message: `${message} (did you mean '${match}'?)`
                        });
                    }
                    else {
                        component.error(node, {
                            code: `invalid-binding`,
                            message: `${message} — valid bindings are ${list_1.default(valid_bindings)}`
                        });
                    }
                }
                this.bindings.push(new Binding_1.default(component, this, scope, node));
            }
            else if (node.type === 'Action') {
                this.actions.push(new Action_1.default(component, this, scope, node));
            }
            else {
                // TODO there shouldn't be anything else here...
            }
        });
    }
}
exports.default = Window;
