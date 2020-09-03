"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Node_1 = __importDefault(require("./shared/Node"));
const Expression_1 = __importDefault(require("./shared/Expression"));
const names_1 = require("../../utils/names");
class EventHandler extends Node_1.default {
    constructor(component, parent, template_scope, info) {
        super(component, parent, template_scope, info);
        this.uses_context = false;
        this.can_make_passive = false;
        this.name = info.name;
        this.modifiers = new Set(info.modifiers);
        if (info.expression) {
            this.expression = new Expression_1.default(component, this, template_scope, info.expression);
            this.uses_context = this.expression.uses_context;
            if (/FunctionExpression/.test(info.expression.type) && info.expression.params.length === 0) {
                // TODO make this detection more accurate — if `event.preventDefault` isn't called, and
                // `event` is passed to another function, we can make it passive
                this.can_make_passive = true;
            }
            else if (info.expression.type === 'Identifier') {
                let node = component.node_for_declaration.get(info.expression.name);
                if (node) {
                    if (node.type === 'VariableDeclaration') {
                        // for `const handleClick = () => {...}`, we want the [arrow] function expression node
                        const declarator = node.declarations.find(d => d.id.name === info.expression.name);
                        node = declarator && declarator.init;
                    }
                    if (node && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') && node.params.length === 0) {
                        this.can_make_passive = true;
                    }
                }
            }
        }
        else {
            this.handler_name = component.get_unique_name(`${names_1.sanitize(this.name)}_handler`);
        }
    }
    get reassigned() {
        if (!this.expression) {
            return false;
        }
        const node = this.expression.node;
        if (/FunctionExpression/.test(node.type)) {
            return false;
        }
        return this.expression.dynamic_dependencies().length > 0;
    }
}
exports.default = EventHandler;
