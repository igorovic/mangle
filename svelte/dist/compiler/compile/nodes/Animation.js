"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
class Animation extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        component.warn_if_undefined(info.name, info, scope);
        this.name = info.name;
        component.add_reference(info.name.split('.')[0]);
        if (parent.animation) {
            component.error(this, {
                code: `duplicate-animation`,
                message: `An element can only have one 'animate' directive`
            });
        }
        const block = parent.parent;
        if (!block || block.type !== 'EachBlock' || !block.key) {
            // TODO can we relax the 'immediate child' rule?
            component.error(this, {
                code: `invalid-animation`,
                message: `An element that use the animate directive must be the immediate child of a keyed each block`
            });
        }
        block.has_animation = true;
        this.expression = info.expression
            ? new Expression_1.default(component, this, scope, info.expression, true)
            : null;
    }
}
exports.default = Animation;
