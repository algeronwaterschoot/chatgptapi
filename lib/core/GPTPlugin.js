"use strict";
// @ts-nocheck
// TODO: A simple way to get a list of all registered classes and methods that accept pre- and afters
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.After = exports.Before = exports.GPTPlugin = void 0;
class GPTPlugin {
    static extend(derivedCtor, constructors) {
        constructors.forEach((baseCtor) => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
                Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
                    Object.create(null));
            });
        });
    }
    static _getMap(map, targetClass, method) {
        const classMap = map.get(targetClass);
        if (!classMap)
            return [];
        return classMap.get(method) || [];
    }
    static addBase(_map, target, method, before) {
        let map = _map.get(target);
        if (!map) {
            map = new Map();
            _map.set(target, map);
        }
        const befores = map.get(method) || [];
        befores.push(before);
        map.set(method, befores);
    }
    static addDefaultBase(_defaultMap, targetClass, method, before) {
        GPTPlugin.addBase(_defaultMap, targetClass, method, before);
    }
    static addInstanceBase(_instanceMap, instance, method, before) {
        GPTPlugin.addBase(_instanceMap, instance, method, before);
    }
    static getInstanceBase(_instanceMap, instance, method) {
        const instanceMap = _instanceMap.get(instance);
        if (!instanceMap)
            return [];
        return instanceMap.get(method) || [];
    }
    static removeBase(_defaultMap, targetClass, method, before) {
        const classMap = _defaultMap.get(targetClass);
        if (classMap) {
            const befores = classMap.get(method);
            if (befores) {
                const index = befores.indexOf(before);
                if (index !== -1) {
                    befores.splice(index, 1);
                }
            }
        }
    }
    static removeDefaultBase(_defaultMap, targetClass, method, before) {
        GPTPlugin.removeBase(_defaultMap, targetClass, method, before);
    }
    static removeInstanceBase(_instanceMap, instance, method, before) {
        GPTPlugin.removeBase(_instanceMap, instance, method, before);
    }
    static addDefaultBefore(targetClass, method, before) {
        GPTPlugin.addDefaultBase(this._defaultBefores, targetClass, method, before);
    }
    static addDefaultAfter(targetClass, method, after) {
        GPTPlugin.addDefaultBase(this._defaultAfters, targetClass, method, after);
    }
    static addInstanceBefore(instance, method, before) {
        GPTPlugin.addInstanceBase(this._instanceBefores, instance, method, before);
    }
    static addInstanceAfter(instance, method, after) {
        GPTPlugin.addInstanceBase(this._instanceAfters, instance, method, after);
    }
    static add(target, method, when, callback) {
        if (false)
            "N/A";
        else if (when === 'Before' && target instanceof Function)
            GPTPlugin.addDefaultBefore(target, method, callback);
        else if (when === 'After' && target instanceof Function)
            GPTPlugin.addDefaultAfter(target, method, callback);
        else if (when === 'Before' && target instanceof Object)
            GPTPlugin.addInstanceBefore(target, method, callback);
        else if (when === 'After' && target instanceof Object)
            GPTPlugin.addInstanceAfter(target, method, callback);
        else
            throw new GPTPluginError("Unsupported plugin configuration");
    }
    static getDefaultBefores(targetClass, method) {
        return this._getMap(this._defaultBefores, targetClass, method);
    }
    static getDefaultAfters(targetClass, method) {
        return this._getMap(this._defaultAfters, targetClass, method);
    }
    static getInstanceBefores(instance, method) {
        return this.getInstanceBase(this._instanceBefores, instance, method);
    }
    static getInstanceAfters(instance, method) {
        return this.getInstanceBase(this._instanceAfters, instance, method);
    }
    static removeDefaultBefore(targetClass, method, before) {
        GPTPlugin.removeDefaultBase(this._defaultBefores, targetClass, method, before);
    }
    static removeDefaultAfter(targetClass, method, after) {
        GPTPlugin.removeDefaultBase(this._defaultAfters, targetClass, method, after);
    }
    static removeInstanceBefore(instance, method, before) {
        GPTPlugin.removeInstanceBase(this._instanceBefores, instance, method, before);
    }
    static removeInstanceAfter(instance, method, after) {
        GPTPlugin.removeInstanceBase(this._instanceAfters, instance, method, after);
    }
    static getAllDefaultBefores() {
        return this._defaultBefores;
    }
    static getAllInstanceBefores() {
        return this._instanceBefores;
    }
    static getDefaultBeforesForClass(targetClass) {
        return this._defaultBefores.get(targetClass);
    }
    static getBeforesForInstance(instance) {
        return this._instanceBefores.get(instance);
    }
    static getAllDefaultAfters() {
        return this._defaultAfters;
    }
    static getAllInstanceAfters() {
        return this._instanceAfters;
    }
    static getDefaultAftersForClass(targetClass) {
        return this._defaultAfters.get(targetClass);
    }
    static getAftersForInstance(instance) {
        return this._instanceAfters.get(instance);
    }
    static copyInstanceBefores(from, to) {
        const instanceMap = this._instanceBefores.get(from);
        this._instanceBefores.set(to, instanceMap === null || instanceMap === void 0 ? void 0 : instanceMap.copyWithin(-1));
    }
    static copyInstanceAfters(from, to) {
        const instanceMap = this._instanceAfters.get(from);
        this._instanceAfters.set(to, instanceMap === null || instanceMap === void 0 ? void 0 : instanceMap.copyWithin(-1));
    }
}
GPTPlugin._defaultBefores = new Map();
GPTPlugin._instanceBefores = new WeakMap();
GPTPlugin._defaultAfters = new Map();
GPTPlugin._instanceAfters = new WeakMap();
exports.GPTPlugin = GPTPlugin;
function Before() {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const targetClass = this.constructor;
                const defaultBefores = GPTPlugin.getDefaultBefores(targetClass, propertyKey);
                const instanceBefores = GPTPlugin.getInstanceBefores(this, propertyKey);
                const allCallbacks = [...defaultBefores, ...instanceBefores];
                for (const callback of allCallbacks) {
                    const newArgs = yield callback(...args);
                    if (newArgs !== undefined)
                        args = newArgs;
                }
                let newLocal;
                newLocal = yield originalMethod.apply(this, args);
                return newLocal;
            });
        };
        return descriptor;
    };
}
exports.Before = Before;
function After() {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                const targetClass = this.constructor;
                const defaultAfters = GPTPlugin.getDefaultAfters(targetClass, propertyKey);
                const instanceAfters = GPTPlugin.getInstanceAfters(this, propertyKey);
                const allCallbacks = [...defaultAfters, ...instanceAfters];
                const originalResult = yield originalMethod.apply(this, args);
                let modifiedResult = originalResult;
                for (const callback of allCallbacks) {
                    let newModifiedResult;
                    newModifiedResult = yield callback(modifiedResult);
                    if (newModifiedResult !== undefined)
                        modifiedResult = newModifiedResult;
                }
                return modifiedResult;
            });
        };
        return descriptor;
    };
}
exports.After = After;
//# sourceMappingURL=GPTPlugin.js.map