"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
class Transition extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        component.warn_if_undefined(info.name, info, scope);
        this.name = info.name;
        component.add_reference(info.name.split('.')[0]);
        this.directive = info.intro && info.outro ? 'transition' : info.intro ? 'in' : 'out';
        this.is_local = info.modifiers.includes('local');
        if ((info.intro && parent.intro) || (info.outro && parent.outro)) {
            const parent_transition = (parent.intro || parent.outro);
            const message = this.directive === parent_transition.directive
                ? `An element can only have one '${this.directive}' directive`
                : `An element cannot have both ${describe(parent_transition)} directive and ${describe(this)} directive`;
            component.error(info, {
                code: `duplicate-transition`,
                message
            });
        }
        this.expression = info.expression
            ? new Expression_1.default(component, this, scope, info.expression, true)
            : null;
    }
}
exports.default = Transition;
function describe(transition) {
    return transition.directive === 'transition'
        ? `a 'transition'`
        : `an '${transition.directive}'`;
}
