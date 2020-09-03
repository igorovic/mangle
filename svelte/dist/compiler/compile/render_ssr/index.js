"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const stringify_1 = require("../utils/stringify");
const Renderer_1 = __importDefault(require("./Renderer"));
function ssr(component, options) {
    const renderer = new Renderer_1.default({
        name: component.name
    });
    const { name } = component;
    // create $$render function
    renderer.render(trim(component.fragment.children), Object.assign({
        locate: component.locate
    }, options));
    // TODO put this inside the Renderer class
    const literal = renderer.pop();
    // TODO concatenate CSS maps
    const css = options.customElement ?
        { code: null, map: null } :
        component.stylesheet.render(options.filename, true);
    const uses_rest = component.var_lookup.has('$$restProps');
    const props = component.vars.filter(variable => !variable.module && variable.export_name);
    const rest = uses_rest ? code_red_1.b `let $$restProps = @compute_rest_props($$props, [${props.map(prop => `"${prop.export_name}"`).join(',')}]);` : null;
    const uses_slots = component.var_lookup.has('$$slots');
    const slots = uses_slots ? code_red_1.b `let $$slots = @compute_slots(#slots);` : null;
    const reactive_stores = component.vars.filter(variable => variable.name[0] === '$' && variable.name[1] !== '$');
    const reactive_store_values = reactive_stores
        .map(({ name }) => {
        const store_name = name.slice(1);
        const store = component.var_lookup.get(store_name);
        if (store && store.hoistable)
            return null;
        const assignment = code_red_1.b `${name} = @get_store_value(${store_name});`;
        return component.compile_options.dev
            ? code_red_1.b `@validate_store(${store_name}, '${store_name}'); ${assignment}`
            : assignment;
    })
        .filter(Boolean);
    component.rewrite_props(({ name }) => {
        const value = `$${name}`;
        let insert = code_red_1.b `${value} = @get_store_value(${name})`;
        if (component.compile_options.dev) {
            insert = code_red_1.b `@validate_store(${name}, '${name}'); ${insert}`;
        }
        return insert;
    });
    const instance_javascript = component.extract_javascript(component.ast.instance);
    // TODO only do this for props with a default value
    const parent_bindings = instance_javascript
        ? component.vars
            .filter(variable => !variable.module && variable.export_name)
            .map(prop => {
            return code_red_1.b `if ($$props.${prop.export_name} === void 0 && $$bindings.${prop.export_name} && ${prop.name} !== void 0) $$bindings.${prop.export_name}(${prop.name});`;
        })
        : [];
    const injected = Array.from(component.injected_reactive_declaration_vars).filter(name => {
        const variable = component.var_lookup.get(name);
        return variable.injected;
    });
    const reactive_declarations = component.reactive_declarations.map(d => {
        const body = d.node.body;
        let statement = code_red_1.b `${body}`;
        if (!d.declaration) { // TODO do not add label if it's not referenced
            statement = code_red_1.b `$: { ${statement} }`;
        }
        return statement;
    });
    const main = renderer.has_bindings
        ? code_red_1.b `
			let $$settled;
			let $$rendered;

			do {
				$$settled = true;

				${reactive_store_values}

				${injected.map(name => code_red_1.b `let ${name};`)}

				${reactive_declarations}

				$$rendered = ${literal};
			} while (!$$settled);

			return $$rendered;
		`
        : code_red_1.b `
			${reactive_store_values}

			${injected.map(name => code_red_1.b `let ${name};`)}

			${reactive_declarations}

			return ${literal};`;
    const blocks = [
        rest,
        slots,
        ...reactive_stores.map(({ name }) => {
            const store_name = name.slice(1);
            const store = component.var_lookup.get(store_name);
            if (store && store.hoistable) {
                return code_red_1.b `let ${name} = @get_store_value(${store_name});`;
            }
            return code_red_1.b `let ${name};`;
        }),
        instance_javascript,
        ...parent_bindings,
        css.code && code_red_1.b `$$result.css.add(#css);`,
        main
    ].filter(Boolean);
    const js = code_red_1.b `
		${css.code ? code_red_1.b `
		const #css = {
			code: "${css.code}",
			map: ${css.map ? stringify_1.string_literal(css.map.toString()) : 'null'}
		};` : null}

		${component.extract_javascript(component.ast.module)}

		${component.fully_hoisted}

		const ${name} = @create_ssr_component(($$result, $$props, $$bindings, #slots) => {
			${blocks}
		});
	`;
    return { js, css };
}
exports.default = ssr;
function trim(nodes) {
    let start = 0;
    for (; start < nodes.length; start += 1) {
        const node = nodes[start];
        if (node.type !== 'Text')
            break;
        node.data = node.data.replace(/^\s+/, '');
        if (node.data)
            break;
    }
    let end = nodes.length;
    for (; end > start; end -= 1) {
        const node = nodes[end - 1];
        if (node.type !== 'Text')
            break;
        node.data = node.data.replace(/\s+$/, '');
        if (node.data)
            break;
    }
    return nodes.slice(start, end);
}
