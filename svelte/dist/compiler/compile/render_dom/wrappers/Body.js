"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const code_red_1 = require("code-red");
const EventHandler_1 = __importDefault(require("./Element/EventHandler"));
const add_event_handlers_1 = __importDefault(require("./shared/add_event_handlers"));
class BodyWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node) {
        super(renderer, block, parent, node);
        this.handlers = this.node.handlers.map(handler => new EventHandler_1.default(handler, this));
    }
    render(block, _parent_node, _parent_nodes) {
        add_event_handlers_1.default(block, code_red_1.x `@_document.body`, this.handlers);
    }
}
exports.default = BodyWrapper;
