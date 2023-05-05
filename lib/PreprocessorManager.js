"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class PreprocessorManager {
    static _defaultCallbacksMap = new Map();
    static _instanceCallbacksMap = new WeakMap();
    static _getCallbacksMap(map, targetClass, methodName) {
        const classMap = map.get(targetClass);
        if (!classMap)
            return [];
        return classMap.get(methodName) || [];
    }
    static addDefaultCallback(targetClass, methodName, callback) {
        let classMap = this._defaultCallbacksMap.get(targetClass);
        if (!classMap) {
            classMap = new Map();
            this._defaultCallbacksMap.set(targetClass, classMap);
        }
        const callbacks = classMap.get(methodName) || [];
        callbacks.push(callback);
        classMap.set(methodName, callbacks);
    }
    static getDefaultCallbacks(targetClass, methodName) {
        return this._getCallbacksMap(this._defaultCallbacksMap, targetClass, methodName);
    }
    static addInstanceCallback(instance, methodName, callback) {
        let instanceMap = this._instanceCallbacksMap.get(instance);
        if (!instanceMap) {
            instanceMap = new Map();
            this._instanceCallbacksMap.set(instance, instanceMap);
        }
        const callbacks = instanceMap.get(methodName) || [];
        callbacks.push(callback);
        instanceMap.set(methodName, callbacks);
    }
    static getInstanceCallbacks(instance, methodName) {
        const instanceMap = this._instanceCallbacksMap.get(instance);
        if (!instanceMap)
            return [];
        return instanceMap.get(methodName) || [];
    }
}
function PreprocessArgs() {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const targetClass = this.constructor;
            const defaultCallbacks = PreprocessorManager.getDefaultCallbacks(targetClass, propertyKey);
            const instanceCallbacks = PreprocessorManager.getInstanceCallbacks(this, propertyKey);
            for (const callback of [...defaultCallbacks, ...instanceCallbacks]) {
                args = callback(args);
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
class MyClass {
    myMethodA(...args) {
        console.log(args);
    }
    myMethodB(...args) {
        console.log(args);
    }
}
__decorate([
    PreprocessArgs(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MyClass.prototype, "myMethodA", null);
__decorate([
    PreprocessArgs(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MyClass.prototype, "myMethodB", null);
// Add a default preprocessing callback for all instances of MyClass.myMethodA
PreprocessorManager.addDefaultCallback(MyClass, 'myMethodA', args => args.map(arg => arg.toUpperCase()));
const instance1 = new MyClass();
const instance2 = new MyClass();
// Add an instance-specific preprocessing callback for instance1.myMethodA
PreprocessorManager.addInstanceCallback(instance1, 'myMethodA', args => args.map(arg => `${arg}!`));
// Add an instance-specific preprocessing callback for instance2.myMethodB
PreprocessorManager.addInstanceCallback(instance2, 'myMethodB', args => args.map(arg => arg.toLowerCase()));
instance1.myMethodA('Hello', 'World'); // Output: ['HELLO!', 'WORLD!']
instance1.myMethodB('Hello', 'World'); // Output: ['Hello', 'World']
instance2.myMethodA('Hello', 'World'); // Output: ['HELLO', 'WORLD']
instance2.myMethodB('Hello', 'World'); // Output: ['hello', 'world']
//# sourceMappingURL=PreprocessorManager.js.map