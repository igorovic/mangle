"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = exports.is_valid = exports.is_void = exports.reserved = exports.globals = void 0;
const acorn_1 = require("acorn");
const full_char_code_at_1 = __importDefault(require("./full_char_code_at"));
exports.globals = new Set([
    'alert',
    'Array',
    'Boolean',
    'clearInterval',
    'clearTimeout',
    'confirm',
    'console',
    'Date',
    'decodeURI',
    'decodeURIComponent',
    'document',
    'encodeURI',
    'encodeURIComponent',
    'Error',
    'EvalError',
    'Event',
    'fetch',
    'global',
    'globalThis',
    'history',
    'Infinity',
    'InternalError',
    'Intl',
    'isFinite',
    'isNaN',
    'JSON',
    'localStorage',
    'location',
    'Map',
    'Math',
    'NaN',
    'navigator',
    'Number',
    'Object',
    'parseFloat',
    'parseInt',
    'process',
    'Promise',
    'prompt',
    'RangeError',
    'ReferenceError',
    'RegExp',
    'sessionStorage',
    'Set',
    'setInterval',
    'setTimeout',
    'String',
    'SyntaxError',
    'TypeError',
    'undefined',
    'URIError',
    'URL',
    'window'
]);
exports.reserved = new Set([
    'arguments',
    'await',
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'eval',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'interface',
    'let',
    'new',
    'null',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'static',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield'
]);
const void_element_names = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
function is_void(name) {
    return void_element_names.test(name) || name.toLowerCase() === '!doctype';
}
exports.is_void = is_void;
function is_valid(str) {
    let i = 0;
    while (i < str.length) {
        const code = full_char_code_at_1.default(str, i);
        if (!(i === 0 ? acorn_1.isIdentifierStart : acorn_1.isIdentifierChar)(code, true))
            return false;
        i += code <= 0xffff ? 1 : 2;
    }
    return true;
}
exports.is_valid = is_valid;
function sanitize(name) {
    return name
        .replace(/[^a-zA-Z0-9_]+/g, '_')
        .replace(/^_/, '')
        .replace(/_$/, '')
        .replace(/^[0-9]/, '_$&');
}
exports.sanitize = sanitize;
