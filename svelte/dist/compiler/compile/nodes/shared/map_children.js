"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AwaitBlock_1 = __importDefault(require("../AwaitBlock"));
const Body_1 = __importDefault(require("../Body"));
const Comment_1 = __importDefault(require("../Comment"));
const EachBlock_1 = __importDefault(require("../EachBlock"));
const Element_1 = __importDefault(require("../Element"));
const Head_1 = __importDefault(require("../Head"));
const IfBlock_1 = __importDefault(require("../IfBlock"));
const InlineComponent_1 = __importDefault(require("../InlineComponent"));
const MustacheTag_1 = __importDefault(require("../MustacheTag"));
const Options_1 = __importDefault(require("../Options"));
const RawMustacheTag_1 = __importDefault(require("../RawMustacheTag"));
const DebugTag_1 = __importDefault(require("../DebugTag"));
const Slot_1 = __importDefault(require("../Slot"));
const Text_1 = __importDefault(require("../Text"));
const Title_1 = __importDefault(require("../Title"));
const Window_1 = __importDefault(require("../Window"));
function get_constructor(type) {
    switch (type) {
        case 'AwaitBlock': return AwaitBlock_1.default;
        case 'Body': return Body_1.default;
        case 'Comment': return Comment_1.default;
        case 'EachBlock': return EachBlock_1.default;
        case 'Element': return Element_1.default;
        case 'Head': return Head_1.default;
        case 'IfBlock': return IfBlock_1.default;
        case 'InlineComponent': return InlineComponent_1.default;
        case 'MustacheTag': return MustacheTag_1.default;
        case 'Options': return Options_1.default;
        case 'RawMustacheTag': return RawMustacheTag_1.default;
        case 'DebugTag': return DebugTag_1.default;
        case 'Slot': return Slot_1.default;
        case 'Text': return Text_1.default;
        case 'Title': return Title_1.default;
        case 'Window': return Window_1.default;
        default: throw new Error(`Not implemented: ${type}`);
    }
}
function map_children(component, parent, scope, children) {
    let last = null;
    let ignores = [];
    return children.map(child => {
        const constructor = get_constructor(child.type);
        const use_ignores = child.type !== 'Text' && child.type !== 'Comment' && ignores.length;
        if (use_ignores)
            component.push_ignores(ignores);
        const node = new constructor(component, parent, scope, child);
        if (use_ignores)
            component.pop_ignores(), ignores = [];
        if (node.type === 'Comment' && node.ignores.length) {
            ignores.push(...node.ignores);
        }
        if (last)
            last.next = node;
        node.prev = last;
        last = node;
        return node;
    });
}
exports.default = map_children;
