"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    str = str.replace(/\r/g, "");
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return (hash >>> 0).toString(36);
}
exports.default = hash;
