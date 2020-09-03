"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_reference_1 = __importDefault(require("is-reference"));
function is_used_as_reference(node, parent) {
    if (!is_reference_1.default(node, parent)) {
        return false;
    }
    if (!parent) {
        return true;
    }
    /* eslint-disable no-fallthrough */
    switch (parent.type) {
        // disregard the `foo` in `const foo = bar`
        case 'VariableDeclarator':
            return node !== parent.id;
        // disregard the `foo`, `bar` in `function foo(bar){}`
        case 'FunctionDeclaration':
        // disregard the `foo` in `import { foo } from 'foo'`
        case 'ImportSpecifier':
        // disregard the `foo` in `import foo from 'foo'`
        case 'ImportDefaultSpecifier':
        // disregard the `foo` in `import * as foo from 'foo'`
        case 'ImportNamespaceSpecifier':
        // disregard the `foo` in `export { foo }`
        case 'ExportSpecifier':
            return false;
        default:
            return true;
    }
}
exports.default = is_used_as_reference;
