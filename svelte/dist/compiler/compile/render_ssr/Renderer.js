"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AwaitBlock_1 = __importDefault(require("./handlers/AwaitBlock"));
const Comment_1 = __importDefault(require("./handlers/Comment"));
const DebugTag_1 = __importDefault(require("./handlers/DebugTag"));
const EachBlock_1 = __importDefault(require("./handlers/EachBlock"));
const Element_1 = __importDefault(require("./handlers/Element"));
const Head_1 = __importDefault(require("./handlers/Head"));
const HtmlTag_1 = __importDefault(require("./handlers/HtmlTag"));
const IfBlock_1 = __importDefault(require("./handlers/IfBlock"));
const InlineComponent_1 = __importDefault(require("./handlers/InlineComponent"));
const Slot_1 = __importDefault(require("./handlers/Slot"));
const Tag_1 = __importDefault(require("./handlers/Tag"));
const Text_1 = __importDefault(require("./handlers/Text"));
const Title_1 = __importDefault(require("./handlers/Title"));
const stringify_1 = require("../utils/stringify");
function noop() { }
const handlers = {
    AwaitBlock: AwaitBlock_1.default,
    Body: noop,
    Comment: Comment_1.default,
    DebugTag: DebugTag_1.default,
    EachBlock: EachBlock_1.default,
    Element: Element_1.default,
    Head: Head_1.default,
    IfBlock: IfBlock_1.default,
    InlineComponent: InlineComponent_1.default,
    MustacheTag: Tag_1.default,
    Options: noop,
    RawMustacheTag: HtmlTag_1.default,
    Slot: Slot_1.default,
    Text: Text_1.default,
    Title: Title_1.default,
    Window: noop
};
class Renderer {
    constructor({ name }) {
        this.has_bindings = false;
        this.stack = [];
        this.targets = [];
        this.name = name;
        this.push();
    }
    add_string(str) {
        this.current.value += stringify_1.escape_template(str);
    }
    add_expression(node) {
        this.literal.quasis.push({
            type: 'TemplateElement',
            value: { raw: this.current.value, cooked: null },
            tail: false
        });
        this.literal.expressions.push(node);
        this.current.value = '';
    }
    push() {
        const current = this.current = { value: '' };
        const literal = this.literal = {
            type: 'TemplateLiteral',
            expressions: [],
            quasis: []
        };
        this.stack.push({ current, literal });
    }
    pop() {
        this.literal.quasis.push({
            type: 'TemplateElement',
            value: { raw: this.current.value, cooked: null },
            tail: true
        });
        const popped = this.stack.pop();
        const last = this.stack[this.stack.length - 1];
        if (last) {
            this.literal = last.literal;
            this.current = last.current;
        }
        return popped.literal;
    }
    render(nodes, options) {
        nodes.forEach(node => {
            const handler = handlers[node.type];
            if (!handler) {
                throw new Error(`No handler for '${node.type}' nodes`);
            }
            handler(node, this, options);
        });
    }
}
exports.default = Renderer;
