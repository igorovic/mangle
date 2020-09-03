"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const is_head_1 = require("./wrappers/shared/is_head");
class Block {
    constructor(options) {
        this.dependencies = new Set();
        this.event_listeners = [];
        this.variables = new Map();
        this.has_update_method = false;
        this.parent = options.parent;
        this.renderer = options.renderer;
        this.name = options.name;
        this.type = options.type;
        this.comment = options.comment;
        this.wrappers = [];
        // for keyed each blocks
        this.key = options.key;
        this.first = null;
        this.bindings = options.bindings;
        this.chunks = {
            declarations: [],
            init: [],
            create: [],
            claim: [],
            hydrate: [],
            mount: [],
            measure: [],
            fix: [],
            animate: [],
            intro: [],
            update: [],
            outro: [],
            destroy: []
        };
        this.has_animation = false;
        this.has_intro_method = false; // a block could have an intro method but not intro transitions, e.g. if a sibling block has intros
        this.has_outro_method = false;
        this.outros = 0;
        this.get_unique_name = this.renderer.component.get_unique_name_maker();
        this.aliases = new Map();
        if (this.key)
            this.aliases.set('key', this.get_unique_name('key'));
    }
    assign_variable_names() {
        const seen = new Set();
        const dupes = new Set();
        let i = this.wrappers.length;
        while (i--) {
            const wrapper = this.wrappers[i];
            if (!wrapper.var)
                continue;
            if (seen.has(wrapper.var.name)) {
                dupes.add(wrapper.var.name);
            }
            seen.add(wrapper.var.name);
        }
        const counts = new Map();
        i = this.wrappers.length;
        while (i--) {
            const wrapper = this.wrappers[i];
            if (!wrapper.var)
                continue;
            let suffix = '';
            if (dupes.has(wrapper.var.name)) {
                const i = counts.get(wrapper.var.name) || 0;
                counts.set(wrapper.var.name, i + 1);
                suffix = i;
            }
            wrapper.var.name = this.get_unique_name(wrapper.var.name + suffix).name;
        }
    }
    add_dependencies(dependencies) {
        dependencies.forEach(dependency => {
            this.dependencies.add(dependency);
        });
        this.has_update_method = true;
        if (this.parent) {
            this.parent.add_dependencies(dependencies);
        }
    }
    add_element(id, render_statement, claim_statement, parent_node, no_detach) {
        this.add_variable(id);
        this.chunks.create.push(code_red_1.b `${id} = ${render_statement};`);
        if (this.renderer.options.hydratable) {
            this.chunks.claim.push(code_red_1.b `${id} = ${claim_statement || render_statement};`);
        }
        if (parent_node) {
            this.chunks.mount.push(code_red_1.b `@append(${parent_node}, ${id});`);
            if (is_head_1.is_head(parent_node) && !no_detach)
                this.chunks.destroy.push(code_red_1.b `@detach(${id});`);
        }
        else {
            this.chunks.mount.push(code_red_1.b `@insert(#target, ${id}, #anchor);`);
            if (!no_detach)
                this.chunks.destroy.push(code_red_1.b `if (detaching) @detach(${id});`);
        }
    }
    add_intro(local) {
        this.has_intros = this.has_intro_method = true;
        if (!local && this.parent)
            this.parent.add_intro();
    }
    add_outro(local) {
        this.has_outros = this.has_outro_method = true;
        this.outros += 1;
        if (!local && this.parent)
            this.parent.add_outro();
    }
    add_animation() {
        this.has_animation = true;
    }
    add_variable(id, init) {
        if (this.variables.has(id.name)) {
            throw new Error(`Variable '${id.name}' already initialised with a different value`);
        }
        this.variables.set(id.name, { id, init });
    }
    alias(name) {
        if (!this.aliases.has(name)) {
            this.aliases.set(name, this.get_unique_name(name));
        }
        return this.aliases.get(name);
    }
    child(options) {
        return new Block(Object.assign({}, this, { key: null }, options, { parent: this }));
    }
    get_contents(key) {
        const { dev } = this.renderer.options;
        if (this.has_outros) {
            this.add_variable({ type: 'Identifier', name: '#current' });
            if (this.chunks.intro.length > 0) {
                this.chunks.intro.push(code_red_1.b `#current = true;`);
                this.chunks.mount.push(code_red_1.b `#current = true;`);
            }
            if (this.chunks.outro.length > 0) {
                this.chunks.outro.push(code_red_1.b `#current = false;`);
            }
        }
        if (this.autofocus) {
            this.chunks.mount.push(code_red_1.b `${this.autofocus}.focus();`);
        }
        this.render_listeners();
        const properties = {};
        const noop = code_red_1.x `@noop`;
        properties.key = key;
        if (this.first) {
            properties.first = code_red_1.x `null`;
            this.chunks.hydrate.push(code_red_1.b `this.first = ${this.first};`);
        }
        if (this.chunks.create.length === 0 && this.chunks.hydrate.length === 0) {
            properties.create = noop;
        }
        else {
            const hydrate = this.chunks.hydrate.length > 0 && (this.renderer.options.hydratable
                ? code_red_1.b `this.h();`
                : this.chunks.hydrate);
            properties.create = code_red_1.x `function #create() {
				${this.chunks.create}
				${hydrate}
			}`;
        }
        if (this.renderer.options.hydratable || this.chunks.claim.length > 0) {
            if (this.chunks.claim.length === 0 && this.chunks.hydrate.length === 0) {
                properties.claim = noop;
            }
            else {
                properties.claim = code_red_1.x `function #claim(#nodes) {
					${this.chunks.claim}
					${this.renderer.options.hydratable && this.chunks.hydrate.length > 0 && code_red_1.b `this.h();`}
				}`;
            }
        }
        if (this.renderer.options.hydratable && this.chunks.hydrate.length > 0) {
            properties.hydrate = code_red_1.x `function #hydrate() {
				${this.chunks.hydrate}
			}`;
        }
        if (this.chunks.mount.length === 0) {
            properties.mount = noop;
        }
        else if (this.event_listeners.length === 0) {
            properties.mount = code_red_1.x `function #mount(#target, #anchor) {
				${this.chunks.mount}
			}`;
        }
        else {
            properties.mount = code_red_1.x `function #mount(#target, #anchor) {
				${this.chunks.mount}
			}`;
        }
        if (this.has_update_method || this.maintain_context) {
            if (this.chunks.update.length === 0 && !this.maintain_context) {
                properties.update = noop;
            }
            else {
                const ctx = this.maintain_context ? code_red_1.x `#new_ctx` : code_red_1.x `#ctx`;
                let dirty = { type: 'Identifier', name: '#dirty' };
                if (!this.renderer.context_overflow && !this.parent) {
                    dirty = { type: 'ArrayPattern', elements: [dirty] };
                }
                properties.update = code_red_1.x `function #update(${ctx}, ${dirty}) {
					${this.maintain_context && code_red_1.b `#ctx = ${ctx};`}
					${this.chunks.update}
				}`;
            }
        }
        if (this.has_animation) {
            properties.measure = code_red_1.x `function #measure() {
				${this.chunks.measure}
			}`;
            properties.fix = code_red_1.x `function #fix() {
				${this.chunks.fix}
			}`;
            properties.animate = code_red_1.x `function #animate() {
				${this.chunks.animate}
			}`;
        }
        if (this.has_intro_method || this.has_outro_method) {
            if (this.chunks.intro.length === 0) {
                properties.intro = noop;
            }
            else {
                properties.intro = code_red_1.x `function #intro(#local) {
					${this.has_outros && code_red_1.b `if (#current) return;`}
					${this.chunks.intro}
				}`;
            }
            if (this.chunks.outro.length === 0) {
                properties.outro = noop;
            }
            else {
                properties.outro = code_red_1.x `function #outro(#local) {
					${this.chunks.outro}
				}`;
            }
        }
        if (this.chunks.destroy.length === 0) {
            properties.destroy = noop;
        }
        else {
            properties.destroy = code_red_1.x `function #destroy(detaching) {
				${this.chunks.destroy}
			}`;
        }
        if (!this.renderer.component.compile_options.dev) {
            // allow shorthand names
            for (const name in properties) {
                const property = properties[name];
                if (property)
                    property.id = null;
            }
        }
        const return_value = code_red_1.x `{
			key: ${properties.key},
			first: ${properties.first},
			c: ${properties.create},
			l: ${properties.claim},
			h: ${properties.hydrate},
			m: ${properties.mount},
			p: ${properties.update},
			r: ${properties.measure},
			f: ${properties.fix},
			a: ${properties.animate},
			i: ${properties.intro},
			o: ${properties.outro},
			d: ${properties.destroy}
		}`;
        const block = dev && this.get_unique_name('block');
        const body = code_red_1.b `
			${this.chunks.declarations}

			${Array.from(this.variables.values()).map(({ id, init }) => {
            return init
                ? code_red_1.b `let ${id} = ${init}`
                : code_red_1.b `let ${id}`;
        })}

			${this.chunks.init}

			${dev
            ? code_red_1.b `
					const ${block} = ${return_value};
					@dispatch_dev("SvelteRegisterBlock", {
						block: ${block},
						id: ${this.name || 'create_fragment'}.name,
						type: "${this.type}",
						source: "${this.comment ? this.comment.replace(/"/g, '\\"') : ''}",
						ctx: #ctx
					});
					return ${block};`
            : code_red_1.b `
					return ${return_value};`}
		`;
        return body;
    }
    has_content() {
        return !!this.first ||
            this.event_listeners.length > 0 ||
            this.chunks.intro.length > 0 ||
            this.chunks.outro.length > 0 ||
            this.chunks.create.length > 0 ||
            this.chunks.hydrate.length > 0 ||
            this.chunks.claim.length > 0 ||
            this.chunks.mount.length > 0 ||
            this.chunks.update.length > 0 ||
            this.chunks.destroy.length > 0 ||
            this.has_animation;
    }
    render() {
        const key = this.key && this.get_unique_name('key');
        const args = [code_red_1.x `#ctx`];
        if (key)
            args.unshift(key);
        const fn = code_red_1.b `function ${this.name}(${args}) {
			${this.get_contents(key)}
		}`;
        return this.comment
            ? code_red_1.b `
				// ${this.comment}
				${fn}`
            : fn;
    }
    render_listeners(chunk = '') {
        if (this.event_listeners.length > 0) {
            this.add_variable({ type: 'Identifier', name: '#mounted' });
            this.chunks.destroy.push(code_red_1.b `#mounted = false`);
            const dispose = {
                type: 'Identifier',
                name: `#dispose${chunk}`
            };
            this.add_variable(dispose);
            if (this.event_listeners.length === 1) {
                this.chunks.mount.push(code_red_1.b `
						if (!#mounted) {
							${dispose} = ${this.event_listeners[0]};
							#mounted = true;
						}
					`);
                this.chunks.destroy.push(code_red_1.b `${dispose}();`);
            }
            else {
                this.chunks.mount.push(code_red_1.b `
					if (!#mounted) {
						${dispose} = [
							${this.event_listeners}
						];
						#mounted = true;
					}
				`);
                this.chunks.destroy.push(code_red_1.b `@run_all(${dispose});`);
            }
        }
    }
}
exports.default = Block;
