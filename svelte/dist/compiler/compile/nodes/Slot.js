"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Element_1 = __importDefault(require("./Element"));
const Attribute_1 = __importDefault(require("./Attribute"));
class Slot extends Element_1.default {
    constructor(component, parent, scope, info) {
        super(component, parent, scope, info);
        this.values = new Map();
        info.attributes.forEach(attr => {
            if (attr.type !== 'Attribute') {
                component.error(attr, {
                    code: `invalid-slot-directive`,
                    message: `<slot> cannot have directives`
                });
            }
            if (attr.name === 'name') {
                if (attr.value.length !== 1 || attr.value[0].type !== 'Text') {
                    component.error(attr, {
                        code: `dynamic-slot-name`,
                        message: `<slot> name cannot be dynamic`
                    });
                }
                this.slot_name = attr.value[0].data;
                if (this.slot_name === 'default') {
                    component.error(attr, {
                        code: `invalid-slot-name`,
                        message: `default is a reserved word — it cannot be used as a slot name`
                    });
                }
            }
            this.values.set(attr.name, new Attribute_1.default(component, this, scope, attr));
        });
        if (!this.slot_name)
            this.slot_name = 'default';
        if (this.slot_name === 'default') {
            // if this is the default slot, add our dependencies to any
            // other slots (which inherit our slot values) that were
            // previously encountered
            component.slots.forEach((slot) => {
                this.values.forEach((attribute, name) => {
                    if (!slot.values.has(name)) {
                        slot.values.set(name, attribute);
                    }
                });
            });
        }
        else if (component.slots.has('default')) {
            // otherwise, go the other way — inherit values from
            // a previously encountered default slot
            const default_slot = component.slots.get('default');
            default_slot.values.forEach((attribute, name) => {
                if (!this.values.has(name)) {
                    this.values.set(name, attribute);
                }
            });
        }
        component.slots.set(this.slot_name, this);
    }
}
exports.default = Slot;
