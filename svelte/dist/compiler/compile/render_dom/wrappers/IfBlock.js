"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const create_debugging_comment_1 = __importDefault(require("./shared/create_debugging_comment"));
const Fragment_1 = __importDefault(require("./Fragment"));
const code_red_1 = require("code-red");
const estree_walker_1 = require("estree-walker");
const is_head_1 = require("./shared/is_head");
function is_else_if(node) {
    return (node && node.children.length === 1 && node.children[0].type === 'IfBlock');
}
class IfBlockBranch extends Wrapper_1.default {
    constructor(renderer, block, parent, node, strip_whitespace, next_sibling) {
        super(renderer, block, parent, node);
        this.var = null;
        const { expression } = node;
        const is_else = !expression;
        if (expression) {
            this.dependencies = expression.dynamic_dependencies();
            // TODO is this the right rule? or should any non-reference count?
            // const should_cache = !is_reference(expression.node, null) && dependencies.length > 0;
            let should_cache = false;
            estree_walker_1.walk(expression.node, {
                enter(node) {
                    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
                        should_cache = true;
                    }
                }
            });
            if (should_cache) {
                this.condition = block.get_unique_name(`show_if`);
                this.snippet = expression.manipulate(block);
            }
            else {
                this.condition = expression.manipulate(block);
            }
        }
        this.block = block.child({
            comment: create_debugging_comment_1.default(node, parent.renderer.component),
            name: parent.renderer.component.get_unique_name(is_else ? `create_else_block` : `create_if_block`),
            type: node.expression ? 'if' : 'else'
        });
        this.fragment = new Fragment_1.default(renderer, this.block, node.children, parent, strip_whitespace, next_sibling);
        this.is_dynamic = this.block.dependencies.size > 0;
    }
}
class IfBlockWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, strip_whitespace, next_sibling) {
        super(renderer, block, parent, node);
        this.needs_update = false;
        this.var = { type: 'Identifier', name: 'if_block' };
        this.cannot_use_innerhtml();
        this.not_static_content();
        this.branches = [];
        const blocks = [];
        let is_dynamic = false;
        let has_intros = false;
        let has_outros = false;
        const create_branches = (node) => {
            const branch = new IfBlockBranch(renderer, block, this, node, strip_whitespace, next_sibling);
            this.branches.push(branch);
            blocks.push(branch.block);
            block.add_dependencies(node.expression.dependencies);
            if (branch.block.dependencies.size > 0) {
                // the condition, or its contents, is dynamic
                is_dynamic = true;
                block.add_dependencies(branch.block.dependencies);
            }
            if (branch.dependencies && branch.dependencies.length > 0) {
                // the condition itself is dynamic
                this.needs_update = true;
            }
            if (branch.block.has_intros)
                has_intros = true;
            if (branch.block.has_outros)
                has_outros = true;
            if (is_else_if(node.else)) {
                create_branches(node.else.children[0]);
            }
            else if (node.else) {
                const branch = new IfBlockBranch(renderer, block, this, node.else, strip_whitespace, next_sibling);
                this.branches.push(branch);
                blocks.push(branch.block);
                if (branch.block.dependencies.size > 0) {
                    is_dynamic = true;
                    block.add_dependencies(branch.block.dependencies);
                }
                if (branch.block.has_intros)
                    has_intros = true;
                if (branch.block.has_outros)
                    has_outros = true;
            }
        };
        create_branches(this.node);
        blocks.forEach(block => {
            block.has_update_method = is_dynamic;
            block.has_intro_method = has_intros;
            block.has_outro_method = has_outros;
        });
        renderer.blocks.push(...blocks);
    }
    render(block, parent_node, parent_nodes) {
        const name = this.var;
        const needs_anchor = this.next ? !this.next.is_dom_node() : !parent_node || !this.parent.is_dom_node();
        const anchor = needs_anchor
            ? block.get_unique_name(`${this.var.name}_anchor`)
            : (this.next && this.next.var) || 'null';
        const has_else = !(this.branches[this.branches.length - 1].condition);
        const if_exists_condition = has_else ? null : name;
        const dynamic = this.branches[0].block.has_update_method; // can use [0] as proxy for all, since they necessarily have the same value
        const has_intros = this.branches[0].block.has_intro_method;
        const has_outros = this.branches[0].block.has_outro_method;
        const has_transitions = has_intros || has_outros;
        const vars = { name, anchor, if_exists_condition, has_else, has_transitions };
        const detaching = parent_node && !is_head_1.is_head(parent_node) ? null : 'detaching';
        if (this.node.else) {
            this.branches.forEach(branch => {
                if (branch.snippet)
                    block.add_variable(branch.condition);
            });
            if (has_outros) {
                this.render_compound_with_outros(block, parent_node, parent_nodes, dynamic, vars, detaching);
                block.chunks.outro.push(code_red_1.b `@transition_out(${name});`);
            }
            else {
                this.render_compound(block, parent_node, parent_nodes, dynamic, vars, detaching);
            }
        }
        else {
            this.render_simple(block, parent_node, parent_nodes, dynamic, vars, detaching);
            if (has_outros) {
                block.chunks.outro.push(code_red_1.b `@transition_out(${name});`);
            }
        }
        if (if_exists_condition) {
            block.chunks.create.push(code_red_1.b `if (${if_exists_condition}) ${name}.c();`);
        }
        else {
            block.chunks.create.push(code_red_1.b `${name}.c();`);
        }
        if (parent_nodes && this.renderer.options.hydratable) {
            if (if_exists_condition) {
                block.chunks.claim.push(code_red_1.b `if (${if_exists_condition}) ${name}.l(${parent_nodes});`);
            }
            else {
                block.chunks.claim.push(code_red_1.b `${name}.l(${parent_nodes});`);
            }
        }
        if (has_intros || has_outros) {
            block.chunks.intro.push(code_red_1.b `@transition_in(${name});`);
        }
        if (needs_anchor) {
            block.add_element(anchor, code_red_1.x `@empty()`, parent_nodes && code_red_1.x `@empty()`, parent_node);
        }
        this.branches.forEach(branch => {
            branch.fragment.render(branch.block, null, code_red_1.x `#nodes`);
        });
    }
    render_compound(block, parent_node, _parent_nodes, dynamic, { name, anchor, has_else, if_exists_condition, has_transitions }, detaching) {
        const select_block_type = this.renderer.component.get_unique_name(`select_block_type`);
        const current_block_type = block.get_unique_name(`current_block_type`);
        const get_block = has_else
            ? code_red_1.x `${current_block_type}(#ctx)`
            : code_red_1.x `${current_block_type} && ${current_block_type}(#ctx)`;
        if (this.needs_update) {
            block.chunks.init.push(code_red_1.b `
				function ${select_block_type}(#ctx, #dirty) {
					${this.branches.map(({ dependencies, condition, snippet, block }) => condition
                ? code_red_1.b `
					${snippet && (dependencies.length > 0
                    ? code_red_1.b `if (${condition} == null || ${block.renderer.dirty(dependencies)}) ${condition} = !!${snippet}`
                    : code_red_1.b `if (${condition} == null) ${condition} = !!${snippet}`)}
					if (${condition}) return ${block.name};`
                : code_red_1.b `return ${block.name};`)}
				}
			`);
        }
        else {
            block.chunks.init.push(code_red_1.b `
				function ${select_block_type}(#ctx, #dirty) {
					${this.branches.map(({ condition, snippet, block }) => condition
                ? code_red_1.b `if (${snippet || condition}) return ${block.name};`
                : code_red_1.b `return ${block.name};`)}
				}
			`);
        }
        block.chunks.init.push(code_red_1.b `
			let ${current_block_type} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()});
			let ${name} = ${get_block};
		`);
        const initial_mount_node = parent_node || '#target';
        const anchor_node = parent_node ? 'null' : '#anchor';
        if (if_exists_condition) {
            block.chunks.mount.push(code_red_1.b `if (${if_exists_condition}) ${name}.m(${initial_mount_node}, ${anchor_node});`);
        }
        else {
            block.chunks.mount.push(code_red_1.b `${name}.m(${initial_mount_node}, ${anchor_node});`);
        }
        if (this.needs_update) {
            const update_mount_node = this.get_update_mount_node(anchor);
            const change_block = code_red_1.b `
				${if_exists_condition ? code_red_1.b `if (${if_exists_condition}) ${name}.d(1)` : code_red_1.b `${name}.d(1)`};
				${name} = ${get_block};
				if (${name}) {
					${name}.c();
					${has_transitions && code_red_1.b `@transition_in(${name}, 1);`}
					${name}.m(${update_mount_node}, ${anchor});
				}
			`;
            if (dynamic) {
                block.chunks.update.push(code_red_1.b `
					if (${current_block_type} === (${current_block_type} = ${select_block_type}(#ctx, #dirty)) && ${name}) {
						${name}.p(#ctx, #dirty);
					} else {
						${change_block}
					}
				`);
            }
            else {
                block.chunks.update.push(code_red_1.b `
					if (${current_block_type} !== (${current_block_type} = ${select_block_type}(#ctx, #dirty))) {
						${change_block}
					}
				`);
            }
        }
        else if (dynamic) {
            if (if_exists_condition) {
                block.chunks.update.push(code_red_1.b `if (${if_exists_condition}) ${name}.p(#ctx, #dirty);`);
            }
            else {
                block.chunks.update.push(code_red_1.b `${name}.p(#ctx, #dirty);`);
            }
        }
        if (if_exists_condition) {
            block.chunks.destroy.push(code_red_1.b `
				if (${if_exists_condition}) {
					${name}.d(${detaching});
				}
			`);
        }
        else {
            block.chunks.destroy.push(code_red_1.b `
				${name}.d(${detaching});
			`);
        }
    }
    // if any of the siblings have outros, we need to keep references to the blocks
    // (TODO does this only apply to bidi transitions?)
    render_compound_with_outros(block, parent_node, _parent_nodes, dynamic, { name, anchor, has_else, has_transitions, if_exists_condition }, detaching) {
        const select_block_type = this.renderer.component.get_unique_name(`select_block_type`);
        const current_block_type_index = block.get_unique_name(`current_block_type_index`);
        const previous_block_index = block.get_unique_name(`previous_block_index`);
        const if_block_creators = block.get_unique_name(`if_block_creators`);
        const if_blocks = block.get_unique_name(`if_blocks`);
        const if_current_block_type_index = has_else
            ? nodes => nodes
            : nodes => code_red_1.b `if (~${current_block_type_index}) { ${nodes} }`;
        block.add_variable(current_block_type_index);
        block.add_variable(name);
        block.chunks.init.push(code_red_1.b `
			const ${if_block_creators} = [
				${this.branches.map(branch => branch.block.name)}
			];

			const ${if_blocks} = [];

			${this.needs_update
            ? code_red_1.b `
					function ${select_block_type}(#ctx, #dirty) {
						${this.branches.map(({ dependencies, condition, snippet }, i) => condition
                ? code_red_1.b `
						${snippet && (dependencies.length > 0
                    ? code_red_1.b `if (${block.renderer.dirty(dependencies)}) ${condition} = !!${snippet}`
                    : code_red_1.b `if (${condition} == null) ${condition} = !!${snippet}`)}
						if (${condition}) return ${i};`
                : code_red_1.b `return ${i};`)}
						${!has_else && code_red_1.b `return -1;`}
					}
				`
            : code_red_1.b `
					function ${select_block_type}(#ctx, #dirty) {
						${this.branches.map(({ condition, snippet }, i) => condition
                ? code_red_1.b `if (${snippet || condition}) return ${i};`
                : code_red_1.b `return ${i};`)}
						${!has_else && code_red_1.b `return -1;`}
					}
				`}
		`);
        if (has_else) {
            block.chunks.init.push(code_red_1.b `
				${current_block_type_index} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()});
				${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
			`);
        }
        else {
            block.chunks.init.push(code_red_1.b `
				if (~(${current_block_type_index} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()}))) {
					${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
				}
			`);
        }
        const initial_mount_node = parent_node || '#target';
        const anchor_node = parent_node ? 'null' : '#anchor';
        block.chunks.mount.push(if_current_block_type_index(code_red_1.b `${if_blocks}[${current_block_type_index}].m(${initial_mount_node}, ${anchor_node});`));
        if (this.needs_update) {
            const update_mount_node = this.get_update_mount_node(anchor);
            const destroy_old_block = code_red_1.b `
				@group_outros();
				@transition_out(${if_blocks}[${previous_block_index}], 1, 1, () => {
					${if_blocks}[${previous_block_index}] = null;
				});
				@check_outros();
			`;
            const create_new_block = code_red_1.b `
				${name} = ${if_blocks}[${current_block_type_index}];
				if (!${name}) {
					${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
					${name}.c();
				}
				${has_transitions && code_red_1.b `@transition_in(${name}, 1);`}
				${name}.m(${update_mount_node}, ${anchor});
			`;
            const change_block = has_else
                ? code_red_1.b `
					${destroy_old_block}

					${create_new_block}
				`
                : code_red_1.b `
					if (${name}) {
						${destroy_old_block}
					}

					if (~${current_block_type_index}) {
						${create_new_block}
					} else {
						${name} = null;
					}
				`;
            if (dynamic) {
                block.chunks.update.push(code_red_1.b `
					let ${previous_block_index} = ${current_block_type_index};
					${current_block_type_index} = ${select_block_type}(#ctx, #dirty);
					if (${current_block_type_index} === ${previous_block_index}) {
						${if_current_block_type_index(code_red_1.b `${if_blocks}[${current_block_type_index}].p(#ctx, #dirty);`)}
					} else {
						${change_block}
					}
				`);
            }
            else {
                block.chunks.update.push(code_red_1.b `
					let ${previous_block_index} = ${current_block_type_index};
					${current_block_type_index} = ${select_block_type}(#ctx, #dirty);
					if (${current_block_type_index} !== ${previous_block_index}) {
						${change_block}
					}
				`);
            }
        }
        else if (dynamic) {
            if (if_exists_condition) {
                block.chunks.update.push(code_red_1.b `if (${if_exists_condition}) ${name}.p(#ctx, #dirty);`);
            }
            else {
                block.chunks.update.push(code_red_1.b `${name}.p(#ctx, #dirty);`);
            }
        }
        block.chunks.destroy.push(if_current_block_type_index(code_red_1.b `${if_blocks}[${current_block_type_index}].d(${detaching});`));
    }
    render_simple(block, parent_node, _parent_nodes, dynamic, { name, anchor, if_exists_condition, has_transitions }, detaching) {
        const branch = this.branches[0];
        if (branch.snippet)
            block.add_variable(branch.condition, branch.snippet);
        block.chunks.init.push(code_red_1.b `
			let ${name} = ${branch.condition} && ${branch.block.name}(#ctx);
		`);
        const initial_mount_node = parent_node || '#target';
        const anchor_node = parent_node ? 'null' : '#anchor';
        block.chunks.mount.push(code_red_1.b `if (${name}) ${name}.m(${initial_mount_node}, ${anchor_node});`);
        if (branch.dependencies.length > 0) {
            const update_mount_node = this.get_update_mount_node(anchor);
            const enter = code_red_1.b `
				if (${name}) {
					${dynamic && code_red_1.b `${name}.p(#ctx, #dirty);`}
					${has_transitions &&
                code_red_1.b `if (${block.renderer.dirty(branch.dependencies)}) {
							@transition_in(${name}, 1);
						}`}
				} else {
					${name} = ${branch.block.name}(#ctx);
					${name}.c();
					${has_transitions && code_red_1.b `@transition_in(${name}, 1);`}
					${name}.m(${update_mount_node}, ${anchor});
				}
			`;
            if (branch.snippet) {
                block.chunks.update.push(code_red_1.b `if (${block.renderer.dirty(branch.dependencies)}) ${branch.condition} = ${branch.snippet}`);
            }
            // no `p()` here — we don't want to update outroing nodes,
            // as that will typically result in glitching
            if (branch.block.has_outro_method) {
                block.chunks.update.push(code_red_1.b `
					if (${branch.condition}) {
						${enter}
					} else if (${name}) {
						@group_outros();
						@transition_out(${name}, 1, 1, () => {
							${name} = null;
						});
						@check_outros();
					}
				`);
            }
            else {
                block.chunks.update.push(code_red_1.b `
					if (${branch.condition}) {
						${enter}
					} else if (${name}) {
						${name}.d(1);
						${name} = null;
					}
				`);
            }
        }
        else if (dynamic) {
            block.chunks.update.push(code_red_1.b `
				if (${branch.condition}) ${name}.p(#ctx, #dirty);
			`);
        }
        if (if_exists_condition) {
            block.chunks.destroy.push(code_red_1.b `
				if (${if_exists_condition}) ${name}.d(${detaching});
			`);
        }
        else {
            block.chunks.destroy.push(code_red_1.b `
				${name}.d(${detaching});
			`);
        }
    }
    get_initial_dirty_bit() {
        const _this = this;
        // TODO: context-overflow make it less gross
        const val = code_red_1.x `-1`;
        return {
            get type() {
                return _this.renderer.context_overflow ? 'ArrayExpression' : 'UnaryExpression';
            },
            // as [-1]
            elements: [val],
            // as -1
            operator: val.operator,
            prefix: val.prefix,
            argument: val.argument
        };
    }
}
exports.default = IfBlockWrapper;
