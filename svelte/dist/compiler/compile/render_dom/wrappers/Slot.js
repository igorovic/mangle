"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const Fragment_1 = __importDefault(require("./Fragment"));
const code_red_1 = require("code-red");
const names_1 = require("../../../utils/names");
const add_to_set_1 = __importDefault(require("../../utils/add_to_set"));
const get_slot_data_1 = __importDefault(require("../../utils/get_slot_data"));
const reserved_keywords_1 = require("../../utils/reserved_keywords");
const is_dynamic_1 = __importDefault(require("./shared/is_dynamic"));
const create_debugging_comment_1 = __importDefault(require("./shared/create_debugging_comment"));
class SlotWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, strip_whitespace, next_sibling) {
        super(renderer, block, parent, node);
        this.fallback = null;
        this.var = { type: 'Identifier', name: 'slot' };
        this.dependencies = new Set(['$$scope']);
        this.cannot_use_innerhtml();
        this.not_static_content();
        if (this.node.children.length) {
            this.fallback = block.child({
                comment: create_debugging_comment_1.default(this.node.children[0], this.renderer.component),
                name: this.renderer.component.get_unique_name(`fallback_block`),
                type: 'fallback'
            });
            renderer.blocks.push(this.fallback);
        }
        this.fragment = new Fragment_1.default(renderer, this.fallback, node.children, this, strip_whitespace, next_sibling);
        this.node.values.forEach(attribute => {
            add_to_set_1.default(this.dependencies, attribute.dependencies);
        });
        block.add_dependencies(this.dependencies);
        // we have to do this, just in case
        block.add_intro();
        block.add_outro();
    }
    render(block, parent_node, parent_nodes) {
        const { renderer } = this;
        const { slot_name } = this.node;
        let get_slot_changes_fn;
        let get_slot_context_fn;
        if (this.node.values.size > 0) {
            get_slot_changes_fn = renderer.component.get_unique_name(`get_${names_1.sanitize(slot_name)}_slot_changes`);
            get_slot_context_fn = renderer.component.get_unique_name(`get_${names_1.sanitize(slot_name)}_slot_context`);
            const changes = code_red_1.x `{}`;
            const dependencies = new Set();
            this.node.values.forEach(attribute => {
                attribute.chunks.forEach(chunk => {
                    if (chunk.dependencies) {
                        add_to_set_1.default(dependencies, chunk.contextual_dependencies);
                        // add_to_set(dependencies, (chunk as Expression).dependencies);
                        chunk.dependencies.forEach(name => {
                            const variable = renderer.component.var_lookup.get(name);
                            if (variable && !variable.hoistable)
                                dependencies.add(name);
                        });
                    }
                });
                const dynamic_dependencies = Array.from(attribute.dependencies).filter((name) => this.is_dependency_dynamic(name));
                if (dynamic_dependencies.length > 0) {
                    changes.properties.push(code_red_1.p `${attribute.name}: ${renderer.dirty(dynamic_dependencies)}`);
                }
            });
            renderer.blocks.push(code_red_1.b `
				const ${get_slot_changes_fn} = #dirty => ${changes};
				const ${get_slot_context_fn} = #ctx => ${get_slot_data_1.default(this.node.values, block)};
			`);
        }
        else {
            get_slot_changes_fn = 'null';
            get_slot_context_fn = 'null';
        }
        let has_fallback = !!this.fallback;
        if (this.fallback) {
            this.fragment.render(this.fallback, null, code_red_1.x `#nodes`);
            has_fallback = this.fallback.has_content();
            if (!has_fallback) {
                renderer.remove_block(this.fallback);
            }
        }
        const slot = block.get_unique_name(`${names_1.sanitize(slot_name)}_slot`);
        const slot_definition = block.get_unique_name(`${names_1.sanitize(slot_name)}_slot_template`);
        const slot_or_fallback = has_fallback ? block.get_unique_name(`${names_1.sanitize(slot_name)}_slot_or_fallback`) : slot;
        block.chunks.init.push(code_red_1.b `
			const ${slot_definition} = ${renderer.reference('#slots')}.${slot_name};
			const ${slot} = @create_slot(${slot_definition}, #ctx, ${renderer.reference('$$scope')}, ${get_slot_context_fn});
			${has_fallback ? code_red_1.b `const ${slot_or_fallback} = ${slot} || ${this.fallback.name}(#ctx);` : null}
		`);
        block.chunks.create.push(code_red_1.b `if (${slot_or_fallback}) ${slot_or_fallback}.c();`);
        if (renderer.options.hydratable) {
            block.chunks.claim.push(code_red_1.b `if (${slot_or_fallback}) ${slot_or_fallback}.l(${parent_nodes});`);
        }
        block.chunks.mount.push(code_red_1.b `
			if (${slot_or_fallback}) {
				${slot_or_fallback}.m(${parent_node || '#target'}, ${parent_node ? 'null' : '#anchor'});
			}
		`);
        block.chunks.intro.push(code_red_1.b `@transition_in(${slot_or_fallback}, #local);`);
        block.chunks.outro.push(code_red_1.b `@transition_out(${slot_or_fallback}, #local);`);
        const dynamic_dependencies = Array.from(this.dependencies).filter((name) => this.is_dependency_dynamic(name));
        const fallback_dynamic_dependencies = has_fallback
            ? Array.from(this.fallback.dependencies).filter((name) => this.is_dependency_dynamic(name))
            : [];
        const slot_update = code_red_1.b `
			if (${slot}.p && ${renderer.dirty(dynamic_dependencies)}) {
				@update_slot(${slot}, ${slot_definition}, #ctx, ${renderer.reference('$$scope')}, #dirty, ${get_slot_changes_fn}, ${get_slot_context_fn});
			}
		`;
        const fallback_update = has_fallback && fallback_dynamic_dependencies.length > 0 && code_red_1.b `
			if (${slot_or_fallback} && ${slot_or_fallback}.p && ${renderer.dirty(fallback_dynamic_dependencies)}) {
				${slot_or_fallback}.p(#ctx, #dirty);
			}
		`;
        if (fallback_update) {
            block.chunks.update.push(code_red_1.b `
				if (${slot}) {
					${slot_update}
				} else {
					${fallback_update}
				}
			`);
        }
        else {
            block.chunks.update.push(code_red_1.b `
				if (${slot}) {
					${slot_update}
				}
			`);
        }
        block.chunks.destroy.push(code_red_1.b `if (${slot_or_fallback}) ${slot_or_fallback}.d(detaching);`);
    }
    is_dependency_dynamic(name) {
        if (name === '$$scope')
            return true;
        if (this.node.scope.is_let(name))
            return true;
        if (reserved_keywords_1.is_reserved_keyword(name))
            return true;
        const variable = this.renderer.component.var_lookup.get(name);
        return is_dynamic_1.default(variable);
    }
}
exports.default = SlotWrapper;
