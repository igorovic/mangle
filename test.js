const fs = require('fs');
const { compile } = require('svelte/compiler');
const debug = require('debug')('mangle');
//const escodegen = require('escodegen');
const Graph = require('./rollup/cjs/src/Graph').default;


const App = fs.readFileSync('./app.svelte', 'utf-8');

const options = { filename: 'app.js', generate: 'ssr', dev: true, css: false};

const res = compile(App, options );
debug(res.js.code);

//const code = escodegen.generate(res.ast.instance.content);


async function build(){
	const graph = new Graph(inputOptions);
	await graph.build()
}




