"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const map_children_1 = __importDefault(require("./shared/map_children"));
const AbstractBlock_1 = __importDefault(require("./shared/AbstractBlock"));
class ThenBlock extends AbstractBlock_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.scope = scope.child();
        if (parent.then_node) {
            parent.then_contexts.forEach(context => {
                this.scope.add(context.key.name, parent.expression.dependencies, this);
            });
        }
        this.children = map_children_1.default(component, parent, this.scope, info.children);
        if (!info.skip) {
            this.warn_if_empty_block();
        }
    }
}
exports.default = ThenBlock;
