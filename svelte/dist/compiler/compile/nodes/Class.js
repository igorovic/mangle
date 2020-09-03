"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
class Class extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.name = info.name;
        this.expression = info.expression
            ? new Expression_1.default(component, this, scope, info.expression)
            : null;
    }
}
exports.default = Class;
