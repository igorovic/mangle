"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ElseBlock_1 = __importDefault(require("./ElseBlock"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const map_children_1 = __importDefault(require("./shared/map_children"));
const AbstractBlock_1 = __importDefault(require("./shared/AbstractBlock"));
const Context_1 = require("./shared/Context");
class EachBlock extends AbstractBlock_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.has_binding = false;
        this.has_index_binding = false;
        this.expression = new Expression_1.default(component, this, scope, info.expression);
        this.context = info.context.name || 'each'; // TODO this is used to facilitate binding; currently fails with destructuring
        this.context_node = info.context;
        this.index = info.index;
        this.scope = scope.child();
        this.contexts = [];
        Context_1.unpack_destructuring(this.contexts, info.context, node => node);
        this.contexts.forEach(context => {
            this.scope.add(context.key.name, this.expression.dependencies, this);
        });
        if (this.index) {
            // index can only change if this is a keyed each block
            const dependencies = info.key ? this.expression.dependencies : new Set([]);
            this.scope.add(this.index, dependencies, this);
        }
        this.key = info.key
            ? new Expression_1.default(component, this, this.scope, info.key)
            : null;
        this.has_animation = false;
        this.children = map_children_1.default(component, this, this.scope, info.children);
        if (this.has_animation) {
            if (this.children.length !== 1) {
                const child = this.children.find(child => !!child.animation);
                component.error(child.animation, {
                    code: `invalid-animation`,
                    message: `An element that use the animate directive must be the sole child of a keyed each block`
                });
            }
        }
        this.warn_if_empty_block();
        this.else = info.else
            ? new ElseBlock_1.default(component, this, this.scope, info.else)
            : null;
    }
}
exports.default = EachBlock;
