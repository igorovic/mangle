"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const list_1 = __importDefault(require("../utils/list"));
const code_red_1 = require("code-red");
const wrappers = { esm, cjs };
function create_module(program, format, name, banner, sveltePath = 'svelte', helpers, globals, imports, module_exports) {
    const internal_path = `${sveltePath}/internal`;
    helpers.sort((a, b) => (a.name < b.name) ? -1 : 1);
    globals.sort((a, b) => (a.name < b.name) ? -1 : 1);
    if (format === 'esm') {
        return esm(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports);
    }
    if (format === 'cjs')
        return cjs(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports);
    throw new Error(`options.format is invalid (must be ${list_1.default(Object.keys(wrappers))})`);
}
exports.default = create_module;
function edit_source(source, sveltePath) {
    return source === 'svelte' || source.startsWith('svelte/')
        ? source.replace('svelte', sveltePath)
        : source;
}
function get_internal_globals(globals, helpers) {
    return globals.length > 0 && {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'ObjectPattern',
                    properties: globals.map(g => ({
                        type: 'Property',
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: { type: 'Identifier', name: g.name },
                        value: g.alias,
                        kind: 'init'
                    }))
                },
                init: helpers.find(({ name }) => name === 'globals').alias
            }]
    };
}
function esm(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports) {
    const import_declaration = {
        type: 'ImportDeclaration',
        specifiers: helpers.map(h => ({
            type: 'ImportSpecifier',
            local: h.alias,
            imported: { type: 'Identifier', name: h.name }
        })),
        source: { type: 'Literal', value: internal_path }
    };
    const internal_globals = get_internal_globals(globals, helpers);
    // edit user imports
    imports.forEach(node => {
        node.source.value = edit_source(node.source.value, sveltePath);
    });
    const exports = module_exports.length > 0 && {
        type: 'ExportNamedDeclaration',
        specifiers: module_exports.map(x => ({
            type: 'Specifier',
            local: { type: 'Identifier', name: x.name },
            exported: { type: 'Identifier', name: x.as }
        }))
    };
    program.body = code_red_1.b `
		/* ${banner} */

		${import_declaration}
		${internal_globals}
		${imports}

		${program.body}

		export default ${name};
		${exports}
	`;
}
function cjs(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports) {
    const internal_requires = {
        type: 'VariableDeclaration',
        kind: 'const',
        declarations: [{
                type: 'VariableDeclarator',
                id: {
                    type: 'ObjectPattern',
                    properties: helpers.map(h => ({
                        type: 'Property',
                        method: false,
                        shorthand: false,
                        computed: false,
                        key: { type: 'Identifier', name: h.name },
                        value: h.alias,
                        kind: 'init'
                    }))
                },
                init: code_red_1.x `require("${internal_path}")`
            }]
    };
    const internal_globals = get_internal_globals(globals, helpers);
    const user_requires = imports.map(node => {
        const init = code_red_1.x `require("${edit_source(node.source.value, sveltePath)}")`;
        if (node.specifiers.length === 0) {
            return code_red_1.b `${init};`;
        }
        return {
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [{
                    type: 'VariableDeclarator',
                    id: node.specifiers[0].type === 'ImportNamespaceSpecifier'
                        ? { type: 'Identifier', name: node.specifiers[0].local.name }
                        : {
                            type: 'ObjectPattern',
                            properties: node.specifiers.map(s => ({
                                type: 'Property',
                                method: false,
                                shorthand: false,
                                computed: false,
                                key: s.type === 'ImportSpecifier' ? s.imported : { type: 'Identifier', name: 'default' },
                                value: s.local,
                                kind: 'init'
                            }))
                        },
                    init
                }]
        };
    });
    const exports = module_exports.map(x => code_red_1.b `exports.${{ type: 'Identifier', name: x.as }} = ${{ type: 'Identifier', name: x.name }};`);
    program.body = code_red_1.b `
		/* ${banner} */

		"use strict";
		${internal_requires}
		${internal_globals}
		${user_requires}

		${program.body}

		exports.default = ${name};
		${exports}
	`;
}
