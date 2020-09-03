"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("../shared/Wrapper"));
const names_1 = require("../../../../utils/names");
const Fragment_1 = __importDefault(require("../Fragment"));
const stringify_1 = require("../../../utils/stringify");
const Text_1 = __importDefault(require("../Text"));
const fix_attribute_casing_1 = __importDefault(require("./fix_attribute_casing"));
const code_red_1 = require("code-red");
const namespaces_1 = require("../../../../utils/namespaces");
const Attribute_1 = __importDefault(require("./Attribute"));
const StyleAttribute_1 = __importDefault(require("./StyleAttribute"));
const SpreadAttribute_1 = __importDefault(require("./SpreadAttribute"));
const patterns_1 = require("../../../../utils/patterns");
const Binding_1 = __importDefault(require("./Binding"));
const add_to_set_1 = __importDefault(require("../../../utils/add_to_set"));
const add_event_handlers_1 = require("../shared/add_event_handlers");
const add_actions_1 = require("../shared/add_actions");
const create_debugging_comment_1 = __importDefault(require("../shared/create_debugging_comment"));
const get_slot_definition_1 = require("../shared/get_slot_definition");
const bind_this_1 = __importDefault(require("../shared/bind_this"));
const is_head_1 = require("../shared/is_head");
const EventHandler_1 = __importDefault(require("./EventHandler"));
const periscopic_1 = require("periscopic");
const Action_1 = __importDefault(require("../../../nodes/Action"));
const MustacheTag_1 = __importDefault(require("../MustacheTag"));
const RawMustacheTag_1 = __importDefault(require("../RawMustacheTag"));
const events = [
    {
        event_names: ['input'],
        filter: (node, _name) => node.name === 'textarea' ||
            node.name === 'input' && !/radio|checkbox|range|file/.test(node.get_static_attribute_value('type'))
    },
    {
        event_names: ['input'],
        filter: (node, name) => (name === 'textContent' || name === 'innerHTML') &&
            node.attributes.some(attribute => attribute.name === 'contenteditable')
    },
    {
        event_names: ['change'],
        filter: (node, _name) => node.name === 'select' ||
            node.name === 'input' && /radio|checkbox|file/.test(node.get_static_attribute_value('type'))
    },
    {
        event_names: ['change', 'input'],
        filter: (node, _name) => node.name === 'input' && node.get_static_attribute_value('type') === 'range'
    },
    {
        event_names: ['elementresize'],
        filter: (_node, name) => patterns_1.dimensions.test(name)
    },
    // media events
    {
        event_names: ['timeupdate'],
        filter: (node, name) => node.is_media_node() &&
            (name === 'currentTime' || name === 'played' || name === 'ended')
    },
    {
        event_names: ['durationchange'],
        filter: (node, name) => node.is_media_node() &&
            name === 'duration'
    },
    {
        event_names: ['play', 'pause'],
        filter: (node, name) => node.is_media_node() &&
            name === 'paused'
    },
    {
        event_names: ['progress'],
        filter: (node, name) => node.is_media_node() &&
            name === 'buffered'
    },
    {
        event_names: ['loadedmetadata'],
        filter: (node, name) => node.is_media_node() &&
            (name === 'buffered' || name === 'seekable')
    },
    {
        event_names: ['volumechange'],
        filter: (node, name) => node.is_media_node() &&
            (name === 'volume' || name === 'muted')
    },
    {
        event_names: ['ratechange'],
        filter: (node, name) => node.is_media_node() &&
            name === 'playbackRate'
    },
    {
        event_names: ['seeking', 'seeked'],
        filter: (node, name) => node.is_media_node() &&
            (name === 'seeking')
    },
    {
        event_names: ['ended'],
        filter: (node, name) => node.is_media_node() &&
            name === 'ended'
    },
    {
        event_names: ['resize'],
        filter: (node, name) => node.is_media_node() &&
            (name === 'videoHeight' || name === 'videoWidth')
    },
    // details event
    {
        event_names: ['toggle'],
        filter: (node, _name) => node.name === 'details'
    }
];
class ElementWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node, strip_whitespace, next_sibling) {
        super(renderer, block, parent, node);
        this.var = {
            type: 'Identifier',
            name: node.name.replace(/[^a-zA-Z0-9_$]/g, '_')
        };
        this.void = names_1.is_void(node.name);
        this.class_dependencies = [];
        if (this.node.children.length) {
            this.node.lets.forEach(l => {
                periscopic_1.extract_names(l.value || l.name).forEach(name => {
                    renderer.add_to_context(name, true);
                });
            });
        }
        this.attributes = this.node.attributes.map(attribute => {
            if (attribute.name === 'slot') {
                // TODO make separate subclass for this?
                let owner = this.parent;
                while (owner) {
                    if (owner.node.type === 'InlineComponent') {
                        break;
                    }
                    if (owner.node.type === 'Element' && /-/.test(owner.node.name)) {
                        break;
                    }
                    owner = owner.parent;
                }
                if (owner && owner.node.type === 'InlineComponent') {
                    const name = attribute.get_static_value();
                    if (!owner.slots.has(name)) {
                        const child_block = block.child({
                            comment: create_debugging_comment_1.default(node, this.renderer.component),
                            name: this.renderer.component.get_unique_name(`create_${names_1.sanitize(name)}_slot`),
                            type: 'slot'
                        });
                        const { scope, lets } = this.node;
                        const seen = new Set(lets.map(l => l.name.name));
                        owner.node.lets.forEach(l => {
                            if (!seen.has(l.name.name))
                                lets.push(l);
                        });
                        owner.slots.set(name, get_slot_definition_1.get_slot_definition(child_block, scope, lets));
                        this.renderer.blocks.push(child_block);
                    }
                    this.slot_block = owner.slots.get(name).block;
                    block = this.slot_block;
                }
            }
            if (attribute.name === 'style') {
                return new StyleAttribute_1.default(this, block, attribute);
            }
            if (attribute.type === 'Spread') {
                return new SpreadAttribute_1.default(this, block, attribute);
            }
            return new Attribute_1.default(this, block, attribute);
        });
        // ordinarily, there'll only be one... but we need to handle
        // the rare case where an element can have multiple bindings,
        // e.g. <audio bind:paused bind:currentTime>
        this.bindings = this.node.bindings.map(binding => new Binding_1.default(block, binding, this));
        this.event_handlers = this.node.handlers.map(event_handler => new EventHandler_1.default(event_handler, this));
        if (node.intro || node.outro) {
            if (node.intro)
                block.add_intro(node.intro.is_local);
            if (node.outro)
                block.add_outro(node.outro.is_local);
        }
        if (node.animation) {
            block.add_animation();
        }
        // add directive and handler dependencies
        [node.animation, node.outro, ...node.actions, ...node.classes].forEach(directive => {
            if (directive && directive.expression) {
                block.add_dependencies(directive.expression.dependencies);
            }
        });
        node.handlers.forEach(handler => {
            if (handler.expression) {
                block.add_dependencies(handler.expression.dependencies);
            }
        });
        if (this.parent) {
            if (node.actions.length > 0 ||
                node.animation ||
                node.bindings.length > 0 ||
                node.classes.length > 0 ||
                node.intro || node.outro ||
                node.handlers.length > 0 ||
                this.node.name === 'option' ||
                renderer.options.dev) {
                this.parent.cannot_use_innerhtml(); // need to use add_location
                this.parent.not_static_content();
            }
        }
        this.fragment = new Fragment_1.default(renderer, block, node.children, this, strip_whitespace, next_sibling);
        if (this.slot_block) {
            block.parent.add_dependencies(block.dependencies);
            // appalling hack
            const index = block.parent.wrappers.indexOf(this);
            block.parent.wrappers.splice(index, 1);
            block.wrappers.push(this);
        }
    }
    render(block, parent_node, parent_nodes) {
        const { renderer } = this;
        if (this.node.name === 'noscript')
            return;
        if (this.slot_block) {
            block = this.slot_block;
        }
        const node = this.var;
        const nodes = parent_nodes && block.get_unique_name(`${this.var.name}_nodes`); // if we're in unclaimable territory, i.e. <head>, parent_nodes is null
        const children = code_red_1.x `@children(${this.node.name === 'template' ? code_red_1.x `${node}.content` : node})`;
        block.add_variable(node);
        const render_statement = this.get_render_statement(block);
        block.chunks.create.push(code_red_1.b `${node} = ${render_statement};`);
        if (renderer.options.hydratable) {
            if (parent_nodes) {
                block.chunks.claim.push(code_red_1.b `
					${node} = ${this.get_claim_statement(parent_nodes)};
				`);
                if (!this.void && this.node.children.length > 0) {
                    block.chunks.claim.push(code_red_1.b `
						var ${nodes} = ${children};
					`);
                }
            }
            else {
                block.chunks.claim.push(code_red_1.b `${node} = ${render_statement};`);
            }
        }
        if (parent_node) {
            block.chunks.mount.push(code_red_1.b `@append(${parent_node}, ${node});`);
            if (is_head_1.is_head(parent_node)) {
                block.chunks.destroy.push(code_red_1.b `@detach(${node});`);
            }
        }
        else {
            block.chunks.mount.push(code_red_1.b `@insert(#target, ${node}, #anchor);`);
            // TODO we eventually need to consider what happens to elements
            // that belong to the same outgroup as an outroing element...
            block.chunks.destroy.push(code_red_1.b `if (detaching) @detach(${node});`);
        }
        // insert static children with textContent or innerHTML
        const can_use_textcontent = this.can_use_textcontent();
        if (!this.node.namespace && (this.can_use_innerhtml || can_use_textcontent) && this.fragment.nodes.length > 0) {
            if (this.fragment.nodes.length === 1 && this.fragment.nodes[0].node.type === 'Text') {
                block.chunks.create.push(code_red_1.b `${node}.textContent = ${stringify_1.string_literal(this.fragment.nodes[0].data)};`);
            }
            else {
                const state = {
                    quasi: {
                        type: 'TemplateElement',
                        value: { raw: '' }
                    }
                };
                const literal = {
                    type: 'TemplateLiteral',
                    expressions: [],
                    quasis: []
                };
                const can_use_raw_text = !this.can_use_innerhtml && can_use_textcontent;
                to_html(this.fragment.nodes, block, literal, state, can_use_raw_text);
                literal.quasis.push(state.quasi);
                block.chunks.create.push(code_red_1.b `${node}.${this.can_use_innerhtml ? 'innerHTML' : 'textContent'} = ${literal};`);
            }
        }
        else {
            this.fragment.nodes.forEach((child) => {
                child.render(block, this.node.name === 'template' ? code_red_1.x `${node}.content` : node, nodes);
            });
        }
        const event_handler_or_binding_uses_context = (this.bindings.some(binding => binding.handler.uses_context) ||
            this.node.handlers.some(handler => handler.uses_context) ||
            this.node.actions.some(action => action.uses_context));
        if (event_handler_or_binding_uses_context) {
            block.maintain_context = true;
        }
        this.add_attributes(block);
        this.add_directives_in_order(block);
        this.add_transitions(block);
        this.add_animation(block);
        this.add_classes(block);
        this.add_manual_style_scoping(block);
        if (nodes && this.renderer.options.hydratable && !this.void) {
            block.chunks.claim.push(code_red_1.b `${this.node.children.length > 0 ? nodes : children}.forEach(@detach);`);
        }
        if (renderer.options.dev) {
            const loc = renderer.locate(this.node.start);
            block.chunks.hydrate.push(code_red_1.b `@add_location(${this.var}, ${renderer.file_var}, ${loc.line - 1}, ${loc.column}, ${this.node.start});`);
        }
    }
    can_use_textcontent() {
        return this.is_static_content && this.fragment.nodes.every(node => node.node.type === 'Text' || node.node.type === 'MustacheTag');
    }
    get_render_statement(block) {
        const { name, namespace } = this.node;
        if (namespace === namespaces_1.namespaces.svg) {
            return code_red_1.x `@svg_element("${name}")`;
        }
        if (namespace) {
            return code_red_1.x `@_document.createElementNS("${namespace}", "${name}")`;
        }
        const is = this.attributes.find(attr => attr.node.name === 'is');
        if (is) {
            return code_red_1.x `@element_is("${name}", ${is.render_chunks(block).reduce((lhs, rhs) => code_red_1.x `${lhs} + ${rhs}`)})`;
        }
        return code_red_1.x `@element("${name}")`;
    }
    get_claim_statement(nodes) {
        const attributes = this.node.attributes
            .filter((attr) => attr.type === 'Attribute')
            .map((attr) => code_red_1.p `${attr.name}: true`);
        const name = this.node.namespace
            ? this.node.name
            : this.node.name.toUpperCase();
        const svg = this.node.namespace === namespaces_1.namespaces.svg ? 1 : null;
        return code_red_1.x `@claim_element(${nodes}, "${name}", { ${attributes} }, ${svg})`;
    }
    add_directives_in_order(block) {
        const binding_groups = events
            .map(event => ({
            events: event.event_names,
            bindings: this.bindings
                .filter(binding => binding.node.name !== 'this')
                .filter(binding => event.filter(this.node, binding.node.name))
        }))
            .filter(group => group.bindings.length);
        const this_binding = this.bindings.find(b => b.node.name === 'this');
        function getOrder(item) {
            if (item instanceof EventHandler_1.default) {
                return item.node.start;
            }
            else if (item instanceof Binding_1.default) {
                return item.node.start;
            }
            else if (item instanceof Action_1.default) {
                return item.start;
            }
            else {
                return item.bindings[0].node.start;
            }
        }
        [
            ...binding_groups,
            ...this.event_handlers,
            this_binding,
            ...this.node.actions
        ]
            .filter(Boolean)
            .sort((a, b) => getOrder(a) - getOrder(b))
            .forEach(item => {
            if (item instanceof EventHandler_1.default) {
                add_event_handlers_1.add_event_handler(block, this.var, item);
            }
            else if (item instanceof Binding_1.default) {
                this.add_this_binding(block, item);
            }
            else if (item instanceof Action_1.default) {
                add_actions_1.add_action(block, this.var, item);
            }
            else {
                this.add_bindings(block, item);
            }
        });
    }
    add_bindings(block, binding_group) {
        const { renderer } = this;
        if (binding_group.bindings.length === 0)
            return;
        renderer.component.has_reactive_assignments = true;
        const lock = binding_group.bindings.some(binding => binding.needs_lock) ?
            block.get_unique_name(`${this.var.name}_updating`) :
            null;
        if (lock)
            block.add_variable(lock, code_red_1.x `false`);
        const handler = renderer.component.get_unique_name(`${this.var.name}_${binding_group.events.join('_')}_handler`);
        renderer.add_to_context(handler.name);
        // TODO figure out how to handle locks
        const needs_lock = binding_group.bindings.some(binding => binding.needs_lock);
        const dependencies = new Set();
        const contextual_dependencies = new Set();
        binding_group.bindings.forEach(binding => {
            // TODO this is a mess
            add_to_set_1.default(dependencies, binding.get_dependencies());
            add_to_set_1.default(contextual_dependencies, binding.handler.contextual_dependencies);
            binding.render(block, lock);
        });
        // media bindings — awkward special case. The native timeupdate events
        // fire too infrequently, so we need to take matters into our
        // own hands
        let animation_frame;
        if (binding_group.events[0] === 'timeupdate') {
            animation_frame = block.get_unique_name(`${this.var.name}_animationframe`);
            block.add_variable(animation_frame);
        }
        const has_local_function = contextual_dependencies.size > 0 || needs_lock || animation_frame;
        let callee = renderer.reference(handler);
        // TODO dry this out — similar code for event handlers and component bindings
        if (has_local_function) {
            const args = Array.from(contextual_dependencies).map(name => renderer.reference(name));
            // need to create a block-local function that calls an instance-level function
            if (animation_frame) {
                block.chunks.init.push(code_red_1.b `
					function ${handler}() {
						@_cancelAnimationFrame(${animation_frame});
						if (!${this.var}.paused) {
							${animation_frame} = @raf(${handler});
							${needs_lock && code_red_1.b `${lock} = true;`}
						}
						${callee}.call(${this.var}, ${args});
					}
				`);
            }
            else {
                block.chunks.init.push(code_red_1.b `
					function ${handler}() {
						${needs_lock && code_red_1.b `${lock} = true;`}
						${callee}.call(${this.var}, ${args});
					}
				`);
            }
            callee = handler;
        }
        const params = Array.from(contextual_dependencies).map(name => ({
            type: 'Identifier',
            name
        }));
        this.renderer.component.partly_hoisted.push(code_red_1.b `
			function ${handler}(${params}) {
				${binding_group.bindings.map(b => b.handler.mutation)}
				${Array.from(dependencies)
            .filter(dep => dep[0] !== '$')
            .filter(dep => !contextual_dependencies.has(dep))
            .map(dep => code_red_1.b `${this.renderer.invalidate(dep)};`)}
			}
		`);
        binding_group.events.forEach(name => {
            if (name === 'elementresize') {
                // special case
                const resize_listener = block.get_unique_name(`${this.var.name}_resize_listener`);
                block.add_variable(resize_listener);
                block.chunks.mount.push(code_red_1.b `${resize_listener} = @add_resize_listener(${this.var}, ${callee}.bind(${this.var}));`);
                block.chunks.destroy.push(code_red_1.b `${resize_listener}();`);
            }
            else {
                block.event_listeners.push(code_red_1.x `@listen(${this.var}, "${name}", ${callee})`);
            }
        });
        const some_initial_state_is_undefined = binding_group.bindings
            .map(binding => code_red_1.x `${binding.snippet} === void 0`)
            .reduce((lhs, rhs) => code_red_1.x `${lhs} || ${rhs}`);
        const should_initialise = (this.node.name === 'select' ||
            binding_group.bindings.find(binding => {
                return (binding.node.name === 'indeterminate' ||
                    binding.node.name === 'textContent' ||
                    binding.node.name === 'innerHTML' ||
                    binding.is_readonly_media_attribute());
            }));
        if (should_initialise) {
            const callback = has_local_function ? handler : code_red_1.x `() => ${callee}.call(${this.var})`;
            block.chunks.hydrate.push(code_red_1.b `if (${some_initial_state_is_undefined}) @add_render_callback(${callback});`);
        }
        if (binding_group.events[0] === 'elementresize') {
            block.chunks.hydrate.push(code_red_1.b `@add_render_callback(() => ${callee}.call(${this.var}));`);
        }
        if (lock) {
            block.chunks.update.push(code_red_1.b `${lock} = false;`);
        }
    }
    add_this_binding(block, this_binding) {
        const { renderer } = this;
        renderer.component.has_reactive_assignments = true;
        const binding_callback = bind_this_1.default(renderer.component, block, this_binding, this.var);
        block.chunks.mount.push(binding_callback);
    }
    add_attributes(block) {
        // Get all the class dependencies first
        this.attributes.forEach((attribute) => {
            if (attribute.node.name === 'class') {
                const dependencies = attribute.node.get_dependencies();
                this.class_dependencies.push(...dependencies);
            }
        });
        if (this.node.attributes.some(attr => attr.is_spread)) {
            this.add_spread_attributes(block);
            return;
        }
        this.attributes.forEach((attribute) => {
            attribute.render(block);
        });
    }
    add_spread_attributes(block) {
        const levels = block.get_unique_name(`${this.var.name}_levels`);
        const data = block.get_unique_name(`${this.var.name}_data`);
        const initial_props = [];
        const updates = [];
        this.attributes
            .forEach(attr => {
            const dependencies = attr.node.get_dependencies();
            const condition = dependencies.length > 0
                ? block.renderer.dirty(dependencies)
                : null;
            if (attr instanceof SpreadAttribute_1.default) {
                const snippet = attr.node.expression.manipulate(block);
                initial_props.push(snippet);
                updates.push(condition ? code_red_1.x `${condition} && ${snippet}` : snippet);
            }
            else {
                const name = attr.property_name || attr.name;
                initial_props.push(code_red_1.x `{ ${name}: ${attr.get_init(block, attr.get_value(block))} }`);
                const snippet = code_red_1.x `{ ${name}: ${attr.should_cache ? attr.last : attr.get_value(block)} }`;
                updates.push(condition ? code_red_1.x `${attr.get_dom_update_conditions(block, condition)} && ${snippet}` : snippet);
            }
        });
        block.chunks.init.push(code_red_1.b `
			let ${levels} = [${initial_props}];

			let ${data} = {};
			for (let #i = 0; #i < ${levels}.length; #i += 1) {
				${data} = @assign(${data}, ${levels}[#i]);
			}
		`);
        const fn = this.node.namespace === namespaces_1.namespaces.svg ? code_red_1.x `@set_svg_attributes` : code_red_1.x `@set_attributes`;
        block.chunks.hydrate.push(code_red_1.b `${fn}(${this.var}, ${data});`);
        block.chunks.update.push(code_red_1.b `
			${fn}(${this.var}, ${data} = @get_spread_update(${levels}, [
				${updates}
			]));
		`);
        // handle edge cases for elements
        if (this.node.name === 'select') {
            const dependencies = new Set();
            for (const attr of this.attributes) {
                for (const dep of attr.node.dependencies) {
                    dependencies.add(dep);
                }
            }
            block.chunks.mount.push(code_red_1.b `
				if (${data}.multiple) @select_options(${this.var}, ${data}.value);
			`);
            block.chunks.update.push(code_red_1.b `
				if (${block.renderer.dirty(Array.from(dependencies))} && ${data}.multiple) @select_options(${this.var}, ${data}.value);
			`);
        }
        else if (this.node.name === 'input' && this.attributes.find(attr => attr.node.name === 'value')) {
            const type = this.node.get_static_attribute_value('type');
            if (type === null || type === "" || type === "text" || type === "email" || type === "password") {
                block.chunks.mount.push(code_red_1.b `
					${this.var}.value = ${data}.value;
				`);
                block.chunks.update.push(code_red_1.b `
					if ('value' in ${data}) {
						${this.var}.value = ${data}.value;
					}
				`);
            }
        }
    }
    add_transitions(block) {
        const { intro, outro } = this.node;
        if (!intro && !outro)
            return;
        if (intro === outro) {
            // bidirectional transition
            const name = block.get_unique_name(`${this.var.name}_transition`);
            const snippet = intro.expression
                ? intro.expression.manipulate(block)
                : code_red_1.x `{}`;
            block.add_variable(name);
            const fn = this.renderer.reference(intro.name);
            const intro_block = code_red_1.b `
				@add_render_callback(() => {
					if (!${name}) ${name} = @create_bidirectional_transition(${this.var}, ${fn}, ${snippet}, true);
					${name}.run(1);
				});
			`;
            const outro_block = code_red_1.b `
				if (!${name}) ${name} = @create_bidirectional_transition(${this.var}, ${fn}, ${snippet}, false);
				${name}.run(0);
			`;
            if (intro.is_local) {
                block.chunks.intro.push(code_red_1.b `
					if (#local) {
						${intro_block}
					}
				`);
                block.chunks.outro.push(code_red_1.b `
					if (#local) {
						${outro_block}
					}
				`);
            }
            else {
                block.chunks.intro.push(intro_block);
                block.chunks.outro.push(outro_block);
            }
            block.chunks.destroy.push(code_red_1.b `if (detaching && ${name}) ${name}.end();`);
        }
        else {
            const intro_name = intro && block.get_unique_name(`${this.var.name}_intro`);
            const outro_name = outro && block.get_unique_name(`${this.var.name}_outro`);
            if (intro) {
                block.add_variable(intro_name);
                const snippet = intro.expression
                    ? intro.expression.manipulate(block)
                    : code_red_1.x `{}`;
                const fn = this.renderer.reference(intro.name);
                let intro_block;
                if (outro) {
                    intro_block = code_red_1.b `
						@add_render_callback(() => {
							if (${outro_name}) ${outro_name}.end(1);
							if (!${intro_name}) ${intro_name} = @create_in_transition(${this.var}, ${fn}, ${snippet});
							${intro_name}.start();
						});
					`;
                    block.chunks.outro.push(code_red_1.b `if (${intro_name}) ${intro_name}.invalidate();`);
                }
                else {
                    intro_block = code_red_1.b `
						if (!${intro_name}) {
							@add_render_callback(() => {
								${intro_name} = @create_in_transition(${this.var}, ${fn}, ${snippet});
								${intro_name}.start();
							});
						}
					`;
                }
                if (intro.is_local) {
                    intro_block = code_red_1.b `
						if (#local) {
							${intro_block}
						}
					`;
                }
                block.chunks.intro.push(intro_block);
            }
            if (outro) {
                block.add_variable(outro_name);
                const snippet = outro.expression
                    ? outro.expression.manipulate(block)
                    : code_red_1.x `{}`;
                const fn = this.renderer.reference(outro.name);
                if (!intro) {
                    block.chunks.intro.push(code_red_1.b `
						if (${outro_name}) ${outro_name}.end(1);
					`);
                }
                // TODO hide elements that have outro'd (unless they belong to a still-outroing
                // group) prior to their removal from the DOM
                let outro_block = code_red_1.b `
					${outro_name} = @create_out_transition(${this.var}, ${fn}, ${snippet});
				`;
                if (outro.is_local) {
                    outro_block = code_red_1.b `
						if (#local) {
							${outro_block}
						}
					`;
                }
                block.chunks.outro.push(outro_block);
                block.chunks.destroy.push(code_red_1.b `if (detaching && ${outro_name}) ${outro_name}.end();`);
            }
        }
    }
    add_animation(block) {
        if (!this.node.animation)
            return;
        const { outro } = this.node;
        const rect = block.get_unique_name('rect');
        const stop_animation = block.get_unique_name('stop_animation');
        block.add_variable(rect);
        block.add_variable(stop_animation, code_red_1.x `@noop`);
        block.chunks.measure.push(code_red_1.b `
			${rect} = ${this.var}.getBoundingClientRect();
		`);
        block.chunks.fix.push(code_red_1.b `
			@fix_position(${this.var});
			${stop_animation}();
			${outro && code_red_1.b `@add_transform(${this.var}, ${rect});`}
		`);
        const params = this.node.animation.expression ? this.node.animation.expression.manipulate(block) : code_red_1.x `{}`;
        const name = this.renderer.reference(this.node.animation.name);
        block.chunks.animate.push(code_red_1.b `
			${stop_animation}();
			${stop_animation} = @create_animation(${this.var}, ${rect}, ${name}, ${params});
		`);
    }
    add_classes(block) {
        const has_spread = this.node.attributes.some(attr => attr.is_spread);
        this.node.classes.forEach(class_directive => {
            const { expression, name } = class_directive;
            let snippet;
            let dependencies;
            if (expression) {
                snippet = expression.manipulate(block);
                dependencies = expression.dependencies;
            }
            else {
                snippet = name;
                dependencies = new Set([name]);
            }
            const updater = code_red_1.b `@toggle_class(${this.var}, "${name}", ${snippet});`;
            block.chunks.hydrate.push(updater);
            if (has_spread) {
                block.chunks.update.push(updater);
            }
            else if ((dependencies && dependencies.size > 0) || this.class_dependencies.length) {
                const all_dependencies = this.class_dependencies.concat(...dependencies);
                const condition = block.renderer.dirty(all_dependencies);
                block.chunks.update.push(code_red_1.b `
					if (${condition}) {
						${updater}
					}`);
            }
        });
    }
    add_manual_style_scoping(block) {
        if (this.node.needs_manual_style_scoping) {
            const updater = code_red_1.b `@toggle_class(${this.var}, "${this.node.component.stylesheet.id}", true);`;
            block.chunks.hydrate.push(updater);
            block.chunks.update.push(updater);
        }
    }
}
exports.default = ElementWrapper;
function to_html(wrappers, block, literal, state, can_use_raw_text) {
    wrappers.forEach(wrapper => {
        if (wrapper instanceof Text_1.default) {
            if (wrapper.use_space())
                state.quasi.value.raw += ' ';
            const parent = wrapper.node.parent;
            const raw = parent && (parent.name === 'script' ||
                parent.name === 'style' ||
                can_use_raw_text);
            state.quasi.value.raw += (raw ? wrapper.data : stringify_1.escape_html(wrapper.data))
                .replace(/\\/g, '\\\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
        }
        else if (wrapper instanceof MustacheTag_1.default || wrapper instanceof RawMustacheTag_1.default) {
            literal.quasis.push(state.quasi);
            literal.expressions.push(wrapper.node.expression.manipulate(block));
            state.quasi = {
                type: 'TemplateElement',
                value: { raw: '' }
            };
        }
        else if (wrapper.node.name === 'noscript') {
            // do nothing
        }
        else {
            // element
            state.quasi.value.raw += `<${wrapper.node.name}`;
            wrapper.attributes.forEach((attr) => {
                state.quasi.value.raw += ` ${fix_attribute_casing_1.default(attr.node.name)}="`;
                attr.node.chunks.forEach(chunk => {
                    if (chunk.type === 'Text') {
                        state.quasi.value.raw += stringify_1.escape_html(chunk.data);
                    }
                    else {
                        literal.quasis.push(state.quasi);
                        literal.expressions.push(chunk.manipulate(block));
                        state.quasi = {
                            type: 'TemplateElement',
                            value: { raw: '' }
                        };
                    }
                });
                state.quasi.value.raw += `"`;
            });
            state.quasi.value.raw += '>';
            if (!wrapper.void) {
                to_html(wrapper.fragment.nodes, block, literal, state);
                state.quasi.value.raw += `</${wrapper.node.name}>`;
            }
        }
    });
}
