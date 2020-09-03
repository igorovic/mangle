"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trim_end = exports.trim_start = void 0;
const patterns_1 = require("./patterns");
function trim_start(str) {
    let i = 0;
    while (patterns_1.whitespace.test(str[i]))
        i += 1;
    return str.slice(i);
}
exports.trim_start = trim_start;
function trim_end(str) {
    let i = str.length;
    while (patterns_1.whitespace.test(str[i - 1]))
        i -= 1;
    return str.slice(0, i);
}
exports.trim_end = trim_end;
