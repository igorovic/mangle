"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Block_1 = __importDefault(require("./Block"));
const Fragment_1 = __importDefault(require("./wrappers/Fragment"));
const code_red_1 = require("code-red");
const flatten_reference_1 = __importDefault(require("../utils/flatten_reference"));
const reserved_keywords_1 = require("../utils/reserved_keywords");
class Renderer {
    constructor(component, options) {
        this.context = [];
        this.initial_context = [];
        this.context_lookup = new Map();
        this.blocks = [];
        this.readonly = new Set();
        this.meta_bindings = []; // initial values for e.g. window.innerWidth, if there's a <svelte:window> meta tag
        this.binding_groups = new Map();
        this.component = component;
        this.options = options;
        this.locate = component.locate; // TODO messy
        this.file_var = options.dev && this.component.get_unique_name('file');
        component.vars.filter(v => !v.hoistable || (v.export_name && !v.module)).forEach(v => this.add_to_context(v.name));
        // ensure store values are included in context
        component.vars.filter(v => v.subscribable).forEach(v => this.add_to_context(`$${v.name}`));
        reserved_keywords_1.reserved_keywords.forEach(keyword => {
            if (component.var_lookup.has(keyword)) {
                this.add_to_context(keyword);
            }
        });
        if (component.slots.size > 0) {
            this.add_to_context('$$scope');
            this.add_to_context('#slots');
        }
        if (this.binding_groups.size > 0) {
            this.add_to_context('$$binding_groups');
        }
        // main block
        this.block = new Block_1.default({
            renderer: this,
            name: null,
            type: 'component',
            key: null,
            bindings: new Map(),
            dependencies: new Set()
        });
        this.block.has_update_method = true;
        this.fragment = new Fragment_1.default(this, this.block, component.fragment.children, null, true, null);
        // TODO messy
        this.blocks.forEach(block => {
            if (block instanceof Block_1.default) {
                block.assign_variable_names();
            }
        });
        this.block.assign_variable_names();
        this.fragment.render(this.block, null, code_red_1.x `#nodes`);
        this.context_overflow = this.context.length > 31;
        this.context.forEach(member => {
            const { variable } = member;
            if (variable) {
                member.priority += 2;
                if (variable.mutated || variable.reassigned)
                    member.priority += 4;
                // these determine whether variable is included in initial context
                // array, so must have the highest priority
                if (variable.export_name)
                    member.priority += 16;
                if (variable.referenced)
                    member.priority += 32;
            }
            else if (member.is_non_contextual) {
                // determine whether variable is included in initial context
                // array, so must have the highest priority
                member.priority += 8;
            }
            if (!member.is_contextual) {
                member.priority += 1;
            }
        });
        this.context.sort((a, b) => (b.priority - a.priority) || (a.index.value - b.index.value));
        this.context.forEach((member, i) => member.index.value = i);
        let i = this.context.length;
        while (i--) {
            const member = this.context[i];
            if (member.variable) {
                if (member.variable.referenced || member.variable.export_name)
                    break;
            }
            else if (member.is_non_contextual) {
                break;
            }
        }
        this.initial_context = this.context.slice(0, i + 1);
    }
    add_to_context(name, contextual = false) {
        if (!this.context_lookup.has(name)) {
            const member = {
                name,
                index: { type: 'Literal', value: this.context.length },
                is_contextual: false,
                is_non_contextual: false,
                variable: null,
                priority: 0
            };
            this.context_lookup.set(name, member);
            this.context.push(member);
        }
        const member = this.context_lookup.get(name);
        if (contextual) {
            member.is_contextual = true;
        }
        else {
            member.is_non_contextual = true;
            member.variable = this.component.var_lookup.get(name);
        }
        return member;
    }
    invalidate(name, value) {
        const variable = this.component.var_lookup.get(name);
        const member = this.context_lookup.get(name);
        if (variable && (variable.subscribable && (variable.reassigned || variable.export_name))) {
            return code_red_1.x `${`$$subscribe_${name}`}($$invalidate(${member.index}, ${value || name}))`;
        }
        if (name[0] === '$' && name[1] !== '$') {
            return code_red_1.x `${name.slice(1)}.set(${value || name})`;
        }
        if (variable && (variable.module || (!variable.referenced &&
            !variable.is_reactive_dependency &&
            !variable.export_name &&
            !name.startsWith('$$')))) {
            return value || name;
        }
        if (value) {
            return code_red_1.x `$$invalidate(${member.index}, ${value})`;
        }
        // if this is a reactive declaration, invalidate dependencies recursively
        const deps = new Set([name]);
        deps.forEach(name => {
            const reactive_declarations = this.component.reactive_declarations.filter(x => x.assignees.has(name));
            reactive_declarations.forEach(declaration => {
                declaration.dependencies.forEach(name => {
                    deps.add(name);
                });
            });
        });
        // TODO ideally globals etc wouldn't be here in the first place
        const filtered = Array.from(deps).filter(n => this.context_lookup.has(n));
        if (!filtered.length)
            return null;
        return filtered
            .map(n => code_red_1.x `$$invalidate(${this.context_lookup.get(n).index}, ${n})`)
            .reduce((lhs, rhs) => code_red_1.x `${lhs}, ${rhs}`);
    }
    dirty(names, is_reactive_declaration = false) {
        const renderer = this;
        const dirty = (is_reactive_declaration
            ? code_red_1.x `$$self.$$.dirty`
            : code_red_1.x `#dirty`);
        const get_bitmask = () => {
            const bitmask = [];
            names.forEach((name) => {
                const member = renderer.context_lookup.get(name);
                if (!member)
                    return;
                if (member.index.value === -1) {
                    throw new Error(`unset index`);
                }
                const value = member.index.value;
                const i = (value / 31) | 0;
                const n = 1 << (value % 31);
                if (!bitmask[i])
                    bitmask[i] = { n: 0, names: [] };
                bitmask[i].n |= n;
                bitmask[i].names.push(name);
            });
            return bitmask;
        };
        // TODO: context-overflow make it less gross
        return {
            // Using a ParenthesizedExpression allows us to create
            // the expression lazily. TODO would be better if
            // context was determined before rendering, so that
            // this indirection was unnecessary
            type: 'ParenthesizedExpression',
            get expression() {
                const bitmask = get_bitmask();
                if (!bitmask.length) {
                    return code_red_1.x `${dirty} & /*${names.join(', ')}*/ 0`;
                }
                if (renderer.context_overflow) {
                    return bitmask
                        .map((b, i) => ({ b, i }))
                        .filter(({ b }) => b)
                        .map(({ b, i }) => code_red_1.x `${dirty}[${i}] & /*${b.names.join(', ')}*/ ${b.n}`)
                        .reduce((lhs, rhs) => code_red_1.x `${lhs} | ${rhs}`);
                }
                return code_red_1.x `${dirty} & /*${names.join(', ')}*/ ${bitmask[0].n}`;
            }
        };
    }
    reference(node) {
        if (typeof node === 'string') {
            node = { type: 'Identifier', name: node };
        }
        const { name, nodes } = flatten_reference_1.default(node);
        const member = this.context_lookup.get(name);
        // TODO is this correct?
        if (this.component.var_lookup.get(name)) {
            this.component.add_reference(name);
        }
        if (member !== undefined) {
            const replacement = code_red_1.x `/*${member.name}*/ #ctx[${member.index}]`;
            if (nodes[0].loc)
                replacement.object.loc = nodes[0].loc;
            nodes[0] = replacement;
            return nodes.reduce((lhs, rhs) => code_red_1.x `${lhs}.${rhs}`);
        }
        return node;
    }
    remove_block(block) {
        this.blocks.splice(this.blocks.indexOf(block), 1);
    }
}
exports.default = Renderer;
