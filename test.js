const fs = require('fs');
const { parse } = require('svelte/compiler');
const debug = require('debug')('mangle')

const App = fs.readFileSync('./app.svelte', 'utf-8');
console.log(App)

const res = parse(App);

console.log(res);
