"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function list(items, conjunction = 'or') {
    if (items.length === 1)
        return items[0];
    return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}
exports.default = list;
