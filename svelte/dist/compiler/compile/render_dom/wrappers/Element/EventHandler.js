"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const code_red_1 = require("code-red");
const TRUE = code_red_1.x `true`;
const FALSE = code_red_1.x `false`;
class EventHandlerWrapper {
    constructor(node, parent) {
        this.node = node;
        this.parent = parent;
        if (!node.expression) {
            this.parent.renderer.add_to_context(node.handler_name.name);
            this.parent.renderer.component.partly_hoisted.push(code_red_1.b `
				function ${node.handler_name.name}(event) {
					@bubble($$self, event);
				}
			`);
        }
    }
    get_snippet(block) {
        const snippet = this.node.expression ? this.node.expression.manipulate(block) : block.renderer.reference(this.node.handler_name);
        if (this.node.reassigned) {
            block.maintain_context = true;
            return code_red_1.x `function () { if (@is_function(${snippet})) ${snippet}.apply(this, arguments); }`;
        }
        return snippet;
    }
    render(block, target) {
        let snippet = this.get_snippet(block);
        if (this.node.modifiers.has('preventDefault'))
            snippet = code_red_1.x `@prevent_default(${snippet})`;
        if (this.node.modifiers.has('stopPropagation'))
            snippet = code_red_1.x `@stop_propagation(${snippet})`;
        if (this.node.modifiers.has('self'))
            snippet = code_red_1.x `@self(${snippet})`;
        const args = [];
        const opts = ['passive', 'once', 'capture'].filter(mod => this.node.modifiers.has(mod));
        if (opts.length) {
            args.push((opts.length === 1 && opts[0] === 'capture')
                ? TRUE
                : code_red_1.x `{ ${opts.map(opt => code_red_1.p `${opt}: true`)} }`);
        }
        else if (block.renderer.options.dev) {
            args.push(FALSE);
        }
        if (block.renderer.options.dev) {
            args.push(this.node.modifiers.has('preventDefault') ? TRUE : FALSE);
            args.push(this.node.modifiers.has('stopPropagation') ? TRUE : FALSE);
        }
        block.event_listeners.push(code_red_1.x `@listen(${target}, "${this.node.name}", ${snippet}, ${args})`);
    }
}
exports.default = EventHandlerWrapper;
