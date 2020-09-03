"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escape_template = exports.escape_html = exports.escape = exports.string_literal = void 0;
function string_literal(data) {
    return {
        type: 'Literal',
        value: data
    };
}
exports.string_literal = string_literal;
function escape(data, { only_escape_at_symbol = false } = {}) {
    return data.replace(only_escape_at_symbol ? /@+/g : /(@+|#+)/g, (match) => {
        return match + match[0];
    });
}
exports.escape = escape;
const escaped = {
    '"': '&quot;',
    "'": '&#39;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};
function escape_html(html) {
    return String(html).replace(/["'&<>]/g, match => escaped[match]);
}
exports.escape_html = escape_html;
function escape_template(str) {
    return str.replace(/(\${|`|\\)/g, '\\$1');
}
exports.escape_template = escape_template;
