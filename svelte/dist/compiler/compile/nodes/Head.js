"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const map_children_1 = __importDefault(require("./shared/map_children"));
const hash_1 = __importDefault(require("../utils/hash"));
class Head extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        if (info.attributes.length) {
            component.error(info.attributes[0], {
                code: `invalid-attribute`,
                message: `<svelte:head> should not have any attributes or directives`
            });
        }
        this.children = map_children_1.default(component, parent, scope, info.children.filter(child => {
            return (child.type !== 'Text' || /\S/.test(child.data));
        }));
        if (this.children.length > 0) {
            this.id = `svelte-${hash_1.default(this.component.source.slice(this.start, this.end))}`;
        }
    }
}
exports.default = Head;
