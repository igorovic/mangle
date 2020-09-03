"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./Node"));
const Expression_1 = __importDefault(require("./Expression"));
class Tag extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.expression = new Expression_1.default(component, this, scope, info.expression);
        this.should_cache = (info.expression.type !== 'Identifier' ||
            (this.expression.dependencies.size && scope.names.has(info.expression.name)));
    }
}
exports.default = Tag;
