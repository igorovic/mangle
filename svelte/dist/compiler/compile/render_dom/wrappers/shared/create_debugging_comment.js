"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function create_debugging_comment(node, component) {
    const { locate, source } = component;
    let c = node.start;
    if (node.type === 'ElseBlock') {
        while (source[c - 1] !== '{')
            c -= 1;
        while (source[c - 1] === '{')
            c -= 1;
    }
    let d;
    if (node.type === 'InlineComponent' || node.type === 'Element') {
        if (node.children.length) {
            d = node.children[0].start;
            while (source[d - 1] !== '>')
                d -= 1;
        }
        else {
            d = node.start;
            while (source[d] !== '>')
                d += 1;
            d += 1;
        }
    }
    else if (node.type === 'Text' || node.type === 'Comment') {
        d = node.end;
    }
    else {
        // @ts-ignore
        d = node.expression ? node.expression.node.end : c;
        while (source[d] !== '}')
            d += 1;
        while (source[d] === '}')
            d += 1;
    }
    const start = locate(c);
    const loc = `(${start.line}:${start.column})`;
    return `${loc} ${source.slice(c, d)}`.replace(/\s/g, ' ');
}
exports.default = create_debugging_comment;
