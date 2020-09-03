"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const pattern = /^\s*svelte-ignore\s+([\s\S]+)\s*$/m;
class Comment extends Node_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.data = info.data;
        const match = pattern.exec(this.data);
        this.ignores = match ? match[1].split(/[^\S]/).map(x => x.trim()).filter(Boolean) : [];
    }
}
exports.default = Comment;
