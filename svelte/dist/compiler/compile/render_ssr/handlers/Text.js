"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stringify_1 = require("../../utils/stringify");
function default_1(node, renderer, _options) {
    let text = node.data;
    if (!node.parent ||
        node.parent.type !== 'Element' ||
        (node.parent.name !== 'script' && node.parent.name !== 'style')) {
        // unless this Text node is inside a <script> or <style> element, escape &,<,>
        text = stringify_1.escape_html(text);
    }
    renderer.add_string(text);
}
exports.default = default_1;
