"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpack_destructuring = void 0;
const code_red_1 = require("code-red");
function unpack_destructuring(contexts, node, modifier) {
    if (!node)
        return;
    if (node.type === 'Identifier') {
        contexts.push({
            key: node,
            modifier
        });
    }
    else if (node.type === 'RestElement') {
        contexts.push({
            key: node.argument,
            modifier
        });
    }
    else if (node.type === 'ArrayPattern') {
        node.elements.forEach((element, i) => {
            if (element && element.type === 'RestElement') {
                unpack_destructuring(contexts, element, node => code_red_1.x `${modifier(node)}.slice(${i})`);
            }
            else if (element && element.type === 'AssignmentPattern') {
                unpack_destructuring(contexts, element.left, node => code_red_1.x `${modifier(node)}[${i}] !== undefined ? ${modifier(node)}[${i}] : ${element.right}`);
            }
            else {
                unpack_destructuring(contexts, element, node => code_red_1.x `${modifier(node)}[${i}]`);
            }
        });
    }
    else if (node.type === 'ObjectPattern') {
        const used_properties = [];
        node.properties.forEach((property) => {
            if (property.type === 'RestElement') {
                unpack_destructuring(contexts, property.argument, node => code_red_1.x `@object_without_properties(${modifier(node)}, [${used_properties}])`);
            }
            else {
                const key = property.key;
                const value = property.value;
                used_properties.push(code_red_1.x `"${key.name}"`);
                if (value.type === 'AssignmentPattern') {
                    unpack_destructuring(contexts, value.left, node => code_red_1.x `${modifier(node)}.${key.name} !== undefined ? ${modifier(node)}.${key.name} : ${value.right}`);
                }
                else {
                    unpack_destructuring(contexts, value, node => code_red_1.x `${modifier(node)}.${key.name}`);
                }
            }
        });
    }
}
exports.unpack_destructuring = unpack_destructuring;
