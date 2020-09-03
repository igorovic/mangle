"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const map_children_1 = __importDefault(require("./shared/map_children"));
class Title extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.children = map_children_1.default(component, parent, scope, info.children);
        if (info.attributes.length > 0) {
            component.error(info.attributes[0], {
                code: `illegal-attribute`,
                message: `<title> cannot have attributes`
            });
        }
        info.children.forEach(child => {
            if (child.type !== 'Text' && child.type !== 'MustacheTag') {
                component.error(child, {
                    code: 'illegal-structure',
                    message: `<title> can only contain text and {tags}`
                });
            }
        });
        this.should_cache = info.children.length === 1
            ? (info.children[0].type !== 'Identifier' ||
                scope.names.has(info.children[0].name))
            : true;
    }
}
exports.default = Title;
