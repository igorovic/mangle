"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const EventHandler_1 = __importDefault(require("./EventHandler"));
class Body extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.handlers = [];
        info.attributes.forEach(node => {
            if (node.type === 'EventHandler') {
                this.handlers.push(new EventHandler_1.default(component, this, scope, node));
            }
            else {
                // TODO there shouldn't be anything else here...
            }
        });
    }
}
exports.default = Body;
