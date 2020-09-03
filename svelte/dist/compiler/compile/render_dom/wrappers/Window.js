"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wrapper_1 = __importDefault(require("./shared/Wrapper"));
const code_red_1 = require("code-red");
const add_event_handlers_1 = __importDefault(require("./shared/add_event_handlers"));
const add_actions_1 = __importDefault(require("./shared/add_actions"));
const EventHandler_1 = __importDefault(require("./Element/EventHandler"));
const associated_events = {
    innerWidth: 'resize',
    innerHeight: 'resize',
    outerWidth: 'resize',
    outerHeight: 'resize',
    scrollX: 'scroll',
    scrollY: 'scroll'
};
const properties = {
    scrollX: 'pageXOffset',
    scrollY: 'pageYOffset'
};
const readonly = new Set([
    'innerWidth',
    'innerHeight',
    'outerWidth',
    'outerHeight',
    'online'
]);
class WindowWrapper extends Wrapper_1.default {
    constructor(renderer, block, parent, node) {
        super(renderer, block, parent, node);
        this.handlers = this.node.handlers.map(handler => new EventHandler_1.default(handler, this));
    }
    render(block, _parent_node, _parent_nodes) {
        const { renderer } = this;
        const { component } = renderer;
        const events = {};
        const bindings = {};
        add_actions_1.default(block, '@_window', this.node.actions);
        add_event_handlers_1.default(block, '@_window', this.handlers);
        this.node.bindings.forEach(binding => {
            // in dev mode, throw if read-only values are written to
            if (readonly.has(binding.name)) {
                renderer.readonly.add(binding.expression.node.name);
            }
            bindings[binding.name] = binding.expression.node.name;
            // bind:online is a special case, we need to listen for two separate events
            if (binding.name === 'online')
                return;
            const associated_event = associated_events[binding.name];
            const property = properties[binding.name] || binding.name;
            if (!events[associated_event])
                events[associated_event] = [];
            events[associated_event].push({
                name: binding.expression.node.name,
                value: property
            });
        });
        const scrolling = block.get_unique_name(`scrolling`);
        const clear_scrolling = block.get_unique_name(`clear_scrolling`);
        const scrolling_timeout = block.get_unique_name(`scrolling_timeout`);
        Object.keys(events).forEach(event => {
            const id = block.get_unique_name(`onwindow${event}`);
            const props = events[event];
            renderer.add_to_context(id.name);
            const fn = renderer.reference(id.name);
            if (event === 'scroll') {
                // TODO other bidirectional bindings...
                block.add_variable(scrolling, code_red_1.x `false`);
                block.add_variable(clear_scrolling, code_red_1.x `() => { ${scrolling} = false }`);
                block.add_variable(scrolling_timeout);
                const condition = bindings.scrollX && bindings.scrollY
                    ? code_red_1.x `"${bindings.scrollX}" in this._state || "${bindings.scrollY}" in this._state`
                    : code_red_1.x `"${bindings.scrollX || bindings.scrollY}" in this._state`;
                const scrollX = bindings.scrollX && code_red_1.x `this._state.${bindings.scrollX}`;
                const scrollY = bindings.scrollY && code_red_1.x `this._state.${bindings.scrollY}`;
                renderer.meta_bindings.push(code_red_1.b `
					if (${condition}) {
						@_scrollTo(${scrollX || '@_window.pageXOffset'}, ${scrollY || '@_window.pageYOffset'});
					}
					${scrollX && `${scrollX} = @_window.pageXOffset;`}
					${scrollY && `${scrollY} = @_window.pageYOffset;`}
				`);
                block.event_listeners.push(code_red_1.x `
					@listen(@_window, "${event}", () => {
						${scrolling} = true;
						@_clearTimeout(${scrolling_timeout});
						${scrolling_timeout} = @_setTimeout(${clear_scrolling}, 100);
						${fn}();
					})
				`);
            }
            else {
                props.forEach(prop => {
                    renderer.meta_bindings.push(code_red_1.b `this._state.${prop.name} = @_window.${prop.value};`);
                });
                block.event_listeners.push(code_red_1.x `
					@listen(@_window, "${event}", ${fn})
				`);
            }
            component.partly_hoisted.push(code_red_1.b `
				function ${id}() {
					${props.map(prop => renderer.invalidate(prop.name, code_red_1.x `${prop.name} = @_window.${prop.value}`))}
				}
			`);
            block.chunks.init.push(code_red_1.b `
				@add_render_callback(${fn});
			`);
            component.has_reactive_assignments = true;
        });
        // special case... might need to abstract this out if we add more special cases
        if (bindings.scrollX || bindings.scrollY) {
            const condition = renderer.dirty([bindings.scrollX, bindings.scrollY].filter(Boolean));
            const scrollX = bindings.scrollX ? renderer.reference(bindings.scrollX) : code_red_1.x `@_window.pageXOffset`;
            const scrollY = bindings.scrollY ? renderer.reference(bindings.scrollY) : code_red_1.x `@_window.pageYOffset`;
            block.chunks.update.push(code_red_1.b `
				if (${condition} && !${scrolling}) {
					${scrolling} = true;
					@_clearTimeout(${scrolling_timeout});
					@_scrollTo(${scrollX}, ${scrollY});
					${scrolling_timeout} = @_setTimeout(${clear_scrolling}, 100);
				}
			`);
        }
        // another special case. (I'm starting to think these are all special cases.)
        if (bindings.online) {
            const id = block.get_unique_name(`onlinestatuschanged`);
            const name = bindings.online;
            renderer.add_to_context(id.name);
            const reference = renderer.reference(id.name);
            component.partly_hoisted.push(code_red_1.b `
				function ${id}() {
					${renderer.invalidate(name, code_red_1.x `${name} = @_navigator.onLine`)}
				}
			`);
            block.chunks.init.push(code_red_1.b `
				@add_render_callback(${reference});
			`);
            block.event_listeners.push(code_red_1.x `@listen(@_window, "online", ${reference})`, code_red_1.x `@listen(@_window, "offline", ${reference})`);
            component.has_reactive_assignments = true;
        }
    }
}
exports.default = WindowWrapper;
