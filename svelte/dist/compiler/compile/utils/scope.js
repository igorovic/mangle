"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extract_identifiers = exports.extract_names = exports.Scope = exports.create_scopes = void 0;
const periscopic_1 = require("periscopic");
Object.defineProperty(exports, "Scope", { enumerable: true, get: function () { return periscopic_1.Scope; } });
Object.defineProperty(exports, "extract_names", { enumerable: true, get: function () { return periscopic_1.extract_names; } });
Object.defineProperty(exports, "extract_identifiers", { enumerable: true, get: function () { return periscopic_1.extract_identifiers; } });
function create_scopes(expression) {
    return periscopic_1.analyze(expression);
}
exports.create_scopes = create_scopes;
