"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
class DebugTag extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.expressions = info.identifiers.map(node => {
            return new Expression_1.default(component, parent, scope, node);
        });
    }
}
exports.default = DebugTag;
