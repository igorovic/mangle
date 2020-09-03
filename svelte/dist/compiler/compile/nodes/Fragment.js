"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const map_children_1 = __importDefault(require("./shared/map_children"));
const TemplateScope_1 = __importDefault(require("./shared/TemplateScope"));
class Fragment extends Node_1.default {
    constructor(component, info) {
        const scope = new TemplateScope_1.default();
        super(component, null, scope, info);
        this.scope = scope;
        this.children = map_children_1.default(component, this, scope, info.children);
    }
}
exports.default = Fragment;
