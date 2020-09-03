"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function add_to_set(a, b) {
    // @ts-ignore
    b.forEach(item => {
        a.add(item);
    });
}
exports.default = add_to_set;
