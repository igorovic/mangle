"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add_event_handler = void 0;
function add_event_handlers(block, target, handlers) {
    handlers.forEach(handler => add_event_handler(block, target, handler));
}
exports.default = add_event_handlers;
function add_event_handler(block, target, handler) {
    handler.render(block, target);
}
exports.add_event_handler = add_event_handler;
