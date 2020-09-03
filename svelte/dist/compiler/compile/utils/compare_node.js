"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare_node = void 0;
function compare_node(a, b) {
    if (a === b)
        return true;
    if (!a || !b)
        return false;
    if (a.type !== b.type)
        return false;
    switch (a.type) {
        case "Identifier":
            return a.name === b.name;
        case "MemberExpression":
            return (compare_node(a.object, b.object) &&
                compare_node(a.property, b.property) &&
                a.computed === b.computed);
        case 'Literal':
            return a.value === b.value;
    }
}
exports.compare_node = compare_node;
