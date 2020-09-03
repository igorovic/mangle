"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
class Action extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        component.warn_if_undefined(info.name, info, scope);
        this.name = info.name;
        component.add_reference(info.name.split('.')[0]);
        this.expression = info.expression
            ? new Expression_1.default(component, this, scope, info.expression)
            : null;
        this.uses_context = this.expression && this.expression.uses_context;
    }
}
exports.default = Action;
