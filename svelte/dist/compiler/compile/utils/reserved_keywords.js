"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is_reserved_keyword = exports.reserved_keywords = void 0;
exports.reserved_keywords = new Set(["$$props", "$$restProps", "$$slots"]);
function is_reserved_keyword(name) {
    return exports.reserved_keywords.has(name);
}
exports.is_reserved_keyword = is_reserved_keyword;
