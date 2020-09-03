"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function is_dynamic(variable) {
    if (variable) {
        if (variable.mutated || variable.reassigned)
            return true; // dynamic internal state
        if (!variable.module && variable.writable && variable.export_name)
            return true; // writable props
    }
    return false;
}
exports.default = is_dynamic;
