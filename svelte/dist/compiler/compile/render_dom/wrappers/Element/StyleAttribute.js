"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const Attribute_1 = __importDefault(require("./Attribute"));
const stringify_1 = require("../../../utils/stringify");
const add_to_set_1 = __importDefault(require("../../../utils/add_to_set"));
class StyleAttributeWrapper extends Attribute_1.default {
    render(block) {
        const style_props = optimize_style(this.node.chunks);
        if (!style_props)
            return super.render(block);
        style_props.forEach((prop) => {
            let value;
            if (is_dynamic(prop.value)) {
                const prop_dependencies = new Set();
                value = prop.value
                    .map(chunk => {
                    if (chunk.type === 'Text') {
                        return stringify_1.string_literal(chunk.data);
                    }
                    else {
                        add_to_set_1.default(prop_dependencies, chunk.dynamic_dependencies());
                        return chunk.manipulate(block);
                    }
                })
                    .reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`);
                // TODO is this necessary? style.setProperty always treats value as string, no?
                // if (prop.value.length === 1 || prop.value[0].type !== 'Text') {
                // 	value = x`"" + ${value}`;
                // }
                if (prop_dependencies.size) {
                    let condition = block.renderer.dirty(Array.from(prop_dependencies));
                    if (block.has_outros) {
                        condition = code_red_1.x `!#current || ${condition}`;
                    }
                    const update = code_red_1.b `
						if (${condition}) {
							@set_style(${this.parent.var}, "${prop.key}", ${value}, ${prop.important ? 1 : null});
						}`;
                    block.chunks.update.push(update);
                }
            }
            else {
                value = stringify_1.string_literal(prop.value[0].data);
            }
            block.chunks.hydrate.push(code_red_1.b `@set_style(${this.parent.var}, "${prop.key}", ${value}, ${prop.important ? 1 : null});`);
        });
    }
}
exports.default = StyleAttributeWrapper;
function optimize_style(value) {
    const props = [];
    let chunks = value.slice();
    while (chunks.length) {
        const chunk = chunks[0];
        if (chunk.type !== 'Text')
            return null;
        const key_match = /^\s*([\w-]+):\s*/.exec(chunk.data);
        if (!key_match)
            return null;
        const key = key_match[1];
        const offset = key_match.index + key_match[0].length;
        const remaining_data = chunk.data.slice(offset);
        if (remaining_data) {
            chunks[0] = {
                start: chunk.start + offset,
                end: chunk.end,
                type: 'Text',
                data: remaining_data
            };
        }
        else {
            chunks.shift();
        }
        const result = get_style_value(chunks);
        props.push({ key, value: result.value, important: result.important });
        chunks = result.chunks;
    }
    return props;
}
function get_style_value(chunks) {
    const value = [];
    let in_url = false;
    let quote_mark = null;
    let escaped = false;
    let closed = false;
    while (chunks.length && !closed) {
        const chunk = chunks.shift();
        if (chunk.type === 'Text') {
            let c = 0;
            while (c < chunk.data.length) {
                const char = chunk.data[c];
                if (escaped) {
                    escaped = false;
                }
                else if (char === '\\') {
                    escaped = true;
                }
                else if (char === quote_mark) {
                    quote_mark = null;
                }
                else if (char === '"' || char === "'") {
                    quote_mark = char;
                }
                else if (char === ')' && in_url) {
                    in_url = false;
                }
                else if (char === 'u' && chunk.data.slice(c, c + 4) === 'url(') {
                    in_url = true;
                }
                else if (char === ';' && !in_url && !quote_mark) {
                    closed = true;
                    break;
                }
                c += 1;
            }
            if (c > 0) {
                value.push({
                    type: 'Text',
                    start: chunk.start,
                    end: chunk.start + c,
                    data: chunk.data.slice(0, c)
                });
            }
            while (/[;\s]/.test(chunk.data[c]))
                c += 1;
            const remaining_data = chunk.data.slice(c);
            if (remaining_data) {
                chunks.unshift({
                    start: chunk.start + c,
                    end: chunk.end,
                    type: 'Text',
                    data: remaining_data
                });
                break;
            }
        }
        else {
            value.push(chunk);
        }
    }
    let important = false;
    const last_chunk = value[value.length - 1];
    if (last_chunk && last_chunk.type === 'Text' && /\s*!important\s*$/.test(last_chunk.data)) {
        important = true;
        last_chunk.data = last_chunk.data.replace(/\s*!important\s*$/, '');
        if (!last_chunk.data)
            value.pop();
    }
    return {
        chunks,
        value,
        important
    };
}
function is_dynamic(value) {
    return value.length > 1 || value[0].type !== 'Text';
}
