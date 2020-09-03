"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const locate_character_1 = require("locate-character");
const get_code_frame_1 = __importDefault(require("./get_code_frame"));
class CompileError extends Error {
    toString() {
        return `${this.message} (${this.start.line}:${this.start.column})\n${this.frame}`;
    }
}
function error(message, props) {
    const error = new CompileError(message);
    error.name = props.name;
    const start = locate_character_1.locate(props.source, props.start, { offsetLine: 1 });
    const end = locate_character_1.locate(props.source, props.end || props.start, { offsetLine: 1 });
    error.code = props.code;
    error.start = start;
    error.end = end;
    error.pos = props.start;
    error.filename = props.filename;
    error.frame = get_code_frame_1.default(props.source, start.line - 1, start.column);
    throw error;
}
exports.default = error;
