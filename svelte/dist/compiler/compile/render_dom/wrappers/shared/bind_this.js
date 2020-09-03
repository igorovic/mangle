"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const compare_node_1 = require("../../../utils/compare_node");
function bind_this(component, block, binding, variable) {
    const fn = component.get_unique_name(`${variable.name}_binding`);
    block.renderer.add_to_context(fn.name);
    const callee = block.renderer.reference(fn.name);
    const { contextual_dependencies, mutation } = binding.handler;
    const dependencies = binding.get_dependencies();
    const body = code_red_1.b `
		${mutation}
		${Array.from(dependencies)
        .filter(dep => dep[0] !== '$')
        .filter(dep => !contextual_dependencies.has(dep))
        .map(dep => code_red_1.b `${block.renderer.invalidate(dep)};`)}
	`;
    if (contextual_dependencies.size) {
        const params = Array.from(contextual_dependencies).map(name => ({
            type: 'Identifier',
            name
        }));
        component.partly_hoisted.push(code_red_1.b `
			function ${fn}($$value, ${params}) {
				@binding_callbacks[$$value ? 'unshift' : 'push'](() => {
					${body}
				});
			}
		`);
        const alias_map = new Map();
        const args = [];
        for (let id of params) {
            const value = block.renderer.reference(id.name);
            let found = false;
            if (block.variables.has(id.name)) {
                let alias = id.name;
                for (let i = 1; block.variables.has(alias) && !compare_node_1.compare_node(block.variables.get(alias).init, value); alias = `${id.name}_${i++}`)
                    ;
                alias_map.set(alias, id.name);
                id = { type: 'Identifier', name: alias };
                found = block.variables.has(alias);
            }
            args.push(id);
            if (!found) {
                block.add_variable(id, value);
            }
        }
        const assign = block.get_unique_name(`assign_${variable.name}`);
        const unassign = block.get_unique_name(`unassign_${variable.name}`);
        block.chunks.init.push(code_red_1.b `
			const ${assign} = () => ${callee}(${variable}, ${args});
			const ${unassign} = () => ${callee}(null, ${args});
		`);
        const condition = Array.from(args)
            .map(name => code_red_1.x `${name} !== ${block.renderer.reference(alias_map.get(name.name) || name.name)}`)
            .reduce((lhs, rhs) => code_red_1.x `${lhs} || ${rhs}`);
        // we push unassign and unshift assign so that references are
        // nulled out before they're created, to avoid glitches
        // with shifting indices
        block.chunks.update.push(code_red_1.b `
			if (${condition}) {
				${unassign}();
				${args.map(a => code_red_1.b `${a} = ${block.renderer.reference(alias_map.get(a.name) || a.name)}`)};
				${assign}();
			}`);
        block.chunks.destroy.push(code_red_1.b `${unassign}();`);
        return code_red_1.b `${assign}();`;
    }
    component.partly_hoisted.push(code_red_1.b `
		function ${fn}($$value) {
			@binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				${body}
			});
		}
	`);
    block.chunks.destroy.push(code_red_1.b `${callee}(null);`);
    return code_red_1.b `${callee}(${variable});`;
}
exports.default = bind_this;
