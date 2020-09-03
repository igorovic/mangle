"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = void 0;
function link(next, prev) {
    prev.next = next;
    if (next)
        next.prev = prev;
}
exports.link = link;
