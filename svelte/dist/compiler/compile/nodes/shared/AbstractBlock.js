"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./Node"));
class AbstractBlock extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
    }
    warn_if_empty_block() {
        if (!this.children || this.children.length > 1)
            return;
        const child = this.children[0];
        if (!child || (child.type === 'Text' && !/[^ \r\n\f\v\t]/.test(child.data))) {
            this.component.warn(this, {
                code: 'empty-block',
                message: 'Empty block'
            });
        }
    }
}
exports.default = AbstractBlock;
