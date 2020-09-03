"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ElseBlock_1 = __importDefault(require("./ElseBlock"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const map_children_1 = __importDefault(require("./shared/map_children"));
const AbstractBlock_1 = __importDefault(require("./shared/AbstractBlock"));
class IfBlock extends AbstractBlock_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.expression = new Expression_1.default(component, this, scope, info.expression);
        this.children = map_children_1.default(component, this, scope, info.children);
        this.else = info.else
            ? new ElseBlock_1.default(component, this, scope, info.else)
            : null;
        this.warn_if_empty_block();
    }
}
exports.default = IfBlock;
