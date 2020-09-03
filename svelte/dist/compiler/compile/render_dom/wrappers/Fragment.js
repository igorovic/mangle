"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AwaitBlock_1 = __importDefault(require("./AwaitBlock"));
const Body_1 = __importDefault(require("./Body"));
const DebugTag_1 = __importDefault(require("./DebugTag"));
const EachBlock_1 = __importDefault(require("./EachBlock"));
const index_1 = __importDefault(require("./Element/index"));
const Head_1 = __importDefault(require("./Head"));
const IfBlock_1 = __importDefault(require("./IfBlock"));
const index_2 = __importDefault(require("./InlineComponent/index"));
const MustacheTag_1 = __importDefault(require("./MustacheTag"));
const RawMustacheTag_1 = __importDefault(require("./RawMustacheTag"));
const Slot_1 = __importDefault(require("./Slot"));
const Text_1 = __importDefault(require("./Text"));
const Title_1 = __importDefault(require("./Title"));
const Window_1 = __importDefault(require("./Window"));
const trim_1 = require("../../../utils/trim");
const link_1 = require("../../../utils/link");
const wrappers = {
    AwaitBlock: AwaitBlock_1.default,
    Body: Body_1.default,
    Comment: null,
    DebugTag: DebugTag_1.default,
    EachBlock: EachBlock_1.default,
    Element: index_1.default,
    Head: Head_1.default,
    IfBlock: IfBlock_1.default,
    InlineComponent: index_2.default,
    MustacheTag: MustacheTag_1.default,
    Options: null,
    RawMustacheTag: RawMustacheTag_1.default,
    Slot: Slot_1.default,
    Text: Text_1.default,
    Title: Title_1.default,
    Window: Window_1.default
};
function trimmable_at(child, next_sibling) {
    // Whitespace is trimmable if one of the following is true:
    // The child and its sibling share a common nearest each block (not at an each block boundary)
    // The next sibling's previous node is an each block
    return (next_sibling.node.find_nearest(/EachBlock/) === child.find_nearest(/EachBlock/)) || next_sibling.node.prev.type === 'EachBlock';
}
class FragmentWrapper {
    constructor(renderer, block, nodes, parent, strip_whitespace, next_sibling) {
        this.nodes = [];
        let last_child;
        let window_wrapper;
        let i = nodes.length;
        while (i--) {
            const child = nodes[i];
            if (!child.type) {
                throw new Error(`missing type`);
            }
            if (!(child.type in wrappers)) {
                throw new Error(`TODO implement ${child.type}`);
            }
            // special case — this is an easy way to remove whitespace surrounding
            // <svelte:window/>. lil hacky but it works
            if (child.type === 'Window') {
                window_wrapper = new Window_1.default(renderer, block, parent, child);
                continue;
            }
            if (child.type === 'Text') {
                let { data } = child;
                // We want to remove trailing whitespace inside an element/component/block,
                // *unless* there is no whitespace between this node and its next sibling
                if (this.nodes.length === 0) {
                    const should_trim = (next_sibling ? (next_sibling.node.type === 'Text' && /^\s/.test(next_sibling.node.data) && trimmable_at(child, next_sibling)) : !child.has_ancestor('EachBlock'));
                    if (should_trim) {
                        data = trim_1.trim_end(data);
                        if (!data)
                            continue;
                    }
                }
                // glue text nodes (which could e.g. be separated by comments) together
                if (last_child && last_child.node.type === 'Text') {
                    last_child.data = data + last_child.data;
                    continue;
                }
                const wrapper = new Text_1.default(renderer, block, parent, child, data);
                if (wrapper.skip)
                    continue;
                this.nodes.unshift(wrapper);
                link_1.link(last_child, last_child = wrapper);
            }
            else {
                const Wrapper = wrappers[child.type];
                if (!Wrapper)
                    continue;
                const wrapper = new Wrapper(renderer, block, parent, child, strip_whitespace, last_child || next_sibling);
                this.nodes.unshift(wrapper);
                link_1.link(last_child, last_child = wrapper);
            }
        }
        if (strip_whitespace) {
            const first = this.nodes[0];
            if (first && first.node.type === 'Text') {
                first.data = trim_1.trim_start(first.data);
                if (!first.data) {
                    first.var = null;
                    this.nodes.shift();
                    if (this.nodes[0]) {
                        this.nodes[0].prev = null;
                    }
                }
            }
        }
        if (window_wrapper) {
            this.nodes.unshift(window_wrapper);
            link_1.link(last_child, window_wrapper);
        }
    }
    render(block, parent_node, parent_nodes) {
        for (let i = 0; i < this.nodes.length; i += 1) {
            this.nodes[i].render(block, parent_node, parent_nodes);
        }
    }
}
exports.default = FragmentWrapper;
