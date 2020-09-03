const fs = require('fs');
const { parse } = require('svelte/compiler');
const debug = require('debug')('mangle');
const escodegen = require('escodegen');
const Component = require('./svelte/dist/compiler/compile/Component').default;
const render_ssr = require('./svelte/dist/compiler/compile/render_ssr').default;
//const Stats = require('./svelte/dist/compiler/Stats').default;
const { Stats } = require('./Stats')


const App = fs.readFileSync('./app.svelte', 'utf-8');



function compile(source, options = {}) {
	options = { filename: 'app.js', generate: 'ssr', dev: true, ...options };

    const warnings = []
    const stats = new Stats();
    stats.start('parse');
	const ast = parse(source, options);
	stats.stop('parse');
    
    stats.start('create component');
	const component = new Component(
		ast,
		source,
		'Component',
		options,
		stats,
		warnings
	);
	stats.stop('create component');

	const result = options.generate === false
		? null
		: options.generate === 'ssr'
			? render_ssr(component, options)
			: render_dom(component, options);

	return component.generate(result);
}


const res = compile(App);
//debug(res);
/* debug(res.instance.content.body); */
const code = escodegen.generate(res.ast.instance);

debug(code);
