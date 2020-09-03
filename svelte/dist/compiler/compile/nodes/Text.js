"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
// Whitespace inside one of these elements will not result in
// a whitespace node being created in any circumstances. (This
// list is almost certainly very incomplete)
const elements_without_text = new Set([
    'audio',
    'datalist',
    'dl',
    'optgroup',
    'select',
    'video'
]);
class Text extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.data = info.data;
        this.synthetic = info.synthetic || false;
    }
    should_skip() {
        if (/\S/.test(this.data))
            return false;
        const parent_element = this.find_nearest(/(?:Element|InlineComponent|Head)/);
        if (!parent_element)
            return false;
        if (parent_element.type === 'Head')
            return true;
        if (parent_element.type === 'InlineComponent')
            return parent_element.children.length === 1 && this === parent_element.children[0];
        // svg namespace exclusions
        if (/svg$/.test(parent_element.namespace)) {
            if (this.prev && this.prev.type === "Element" && this.prev.name === "tspan")
                return false;
        }
        return parent_element.namespace || elements_without_text.has(parent_element.name);
    }
}
exports.default = Text;
