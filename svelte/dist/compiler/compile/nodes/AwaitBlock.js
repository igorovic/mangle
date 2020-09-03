"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const PendingBlock_1 = __importDefault(require("./PendingBlock"));
const ThenBlock_1 = __importDefault(require("./ThenBlock"));
const CatchBlock_1 = __importDefault(require("./CatchBlock"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const Context_1 = require("./shared/Context");
class AwaitBlock extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.expression = new Expression_1.default(component, this, scope, info.expression);
        this.then_node = info.value;
        this.catch_node = info.error;
        if (this.then_node) {
            this.then_contexts = [];
            Context_1.unpack_destructuring(this.then_contexts, info.value, node => node);
        }
        if (this.catch_node) {
            this.catch_contexts = [];
            Context_1.unpack_destructuring(this.catch_contexts, info.error, node => node);
        }
        this.pending = new PendingBlock_1.default(component, this, scope, info.pending);
        this.then = new ThenBlock_1.default(component, this, scope, info.then);
        this.catch = new CatchBlock_1.default(component, this, scope, info.catch);
    }
}
exports.default = AwaitBlock;
