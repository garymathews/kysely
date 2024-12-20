"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = exports.noop = exports.isReadonlyArray = exports.asReadonlyArray = exports.asArray = exports.freeze = exports.getLast = exports.isPlainObject = exports.isArrayBufferOrView = exports.isObject = exports.isFunction = exports.isBuffer = exports.isBigInt = exports.isDate = exports.isNull = exports.isBoolean = exports.isNumber = exports.isString = exports.isUndefined = exports.isEmpty = void 0;
function isEmpty(obj) {
    if (Array.isArray(obj) || isString(obj) || isBuffer(obj)) {
        return obj.length === 0;
    }
    else if (obj) {
        return Object.keys(obj).length === 0;
    }
    return false;
}
exports.isEmpty = isEmpty;
function isUndefined(obj) {
    return typeof obj === 'undefined' || obj === undefined;
}
exports.isUndefined = isUndefined;
function isString(obj) {
    return typeof obj === 'string';
}
exports.isString = isString;
function isNumber(obj) {
    return typeof obj === 'number';
}
exports.isNumber = isNumber;
function isBoolean(obj) {
    return typeof obj === 'boolean';
}
exports.isBoolean = isBoolean;
function isNull(obj) {
    return obj === null;
}
exports.isNull = isNull;
function isDate(obj) {
    return obj instanceof Date;
}
exports.isDate = isDate;
function isBigInt(obj) {
    return typeof obj === 'bigint';
}
exports.isBigInt = isBigInt;
// Don't change the returnd type to `obj is Buffer` to not create a
// hard dependency to node.
function isBuffer(obj) {
    return typeof Buffer !== 'undefined' && Buffer.isBuffer(obj);
}
exports.isBuffer = isBuffer;
function isFunction(obj) {
    return typeof obj === 'function';
}
exports.isFunction = isFunction;
function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
}
exports.isObject = isObject;
function isArrayBufferOrView(obj) {
    return obj instanceof ArrayBuffer || ArrayBuffer.isView(obj);
}
exports.isArrayBufferOrView = isArrayBufferOrView;
function isPlainObject(obj) {
    return (isObject(obj) &&
        !Array.isArray(obj) &&
        !isDate(obj) &&
        !isBuffer(obj) &&
        !isArrayBufferOrView(obj));
}
exports.isPlainObject = isPlainObject;
function getLast(arr) {
    return arr[arr.length - 1];
}
exports.getLast = getLast;
function freeze(obj) {
    return Object.freeze(obj);
}
exports.freeze = freeze;
function asArray(arg) {
    if (isReadonlyArray(arg)) {
        return arg;
    }
    else {
        return [arg];
    }
}
exports.asArray = asArray;
function asReadonlyArray(arg) {
    if (isReadonlyArray(arg)) {
        return arg;
    }
    else {
        return freeze([arg]);
    }
}
exports.asReadonlyArray = asReadonlyArray;
function isReadonlyArray(arg) {
    return Array.isArray(arg);
}
exports.isReadonlyArray = isReadonlyArray;
function noop(obj) {
    return obj;
}
exports.noop = noop;
function compare(obj1, obj2) {
    if (isReadonlyArray(obj1) && isReadonlyArray(obj2)) {
        return compareArrays(obj1, obj2);
    }
    else if (isObject(obj1) && isObject(obj2)) {
        return compareObjects(obj1, obj2);
    }
    return obj1 === obj2;
}
exports.compare = compare;
function compareArrays(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; ++i) {
        if (!compare(arr1[i], arr2[i])) {
            return false;
        }
    }
    return true;
}
function compareObjects(obj1, obj2) {
    if (isBuffer(obj1) && isBuffer(obj2)) {
        return compareBuffers(obj1, obj2);
    }
    else if (isDate(obj1) && isDate(obj2)) {
        return compareDates(obj1, obj2);
    }
    return compareGenericObjects(obj1, obj2);
}
function compareBuffers(buf1, buf2) {
    return Buffer.compare(buf1, buf2) === 0;
}
function compareDates(date1, date2) {
    return date1.getTime() === date2.getTime();
}
function compareGenericObjects(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (!compare(obj1[key], obj2[key])) {
            return false;
        }
    }
    return true;
}
