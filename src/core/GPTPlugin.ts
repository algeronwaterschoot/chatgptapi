// @ts-nocheck
// TODO: A simple way to get a list of all registered classes and methods that accept pre- and afters

// import * as async from 'async';

type DefaultMapType = Map<Function, Map<string | symbol, (...args: any) => any>[]>
type DefaultMapCollectionType = Map<Function, Map<string | symbol, (...args: any[]) => any>[]>

type InstanceMapType = WeakMap<Object, Map<string | symbol, (...args: any) => any>[]>
type InstanceMapCollectionType = WeakMap<Object, Map<string | symbol, (...args: any[]) => any>[]>


export class GPTPlugin {

    private static _defaultBefores: DefaultMapType = new Map();
    private static _instanceBefores: InstanceMapType = new WeakMap();

    private static _defaultAfters: DefaultMapType = new Map();
    private static _instanceAfters: InstanceMapType = new WeakMap();

    static extend(derivedCtor: any, constructors: any[]) {
        constructors.forEach((baseCtor) => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
                Object.defineProperty(
                    derivedCtor.prototype,
                    name,
                    Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
                    Object.create(null)
                )
            })
        })
    }

    private static _getMap(
        map: DefaultMapType,
        targetClass: Function, method: string | symbol): (...args: any) => any {
        const classMap = map.get(targetClass)
        if (!classMap) return []
        return classMap.get(method) || []
    }

    private static addBase<T1, T2>(_map: T1, target: T2, method: string | symbol, before: (...args: any[]) => any) {
        let map = _map.get(target)
        if (!map) {
            map = new Map()
            _map.set(target, map)
        }
        const befores = map.get(method) || []
        befores.push(before)
        map.set(method, befores)
    }

    private static addDefaultBase(_defaultMap: DefaultMapCollectionType, targetClass: Function, method: string | symbol, before: (...args: any[]) => any) {
        GPTPlugin.addBase<DefaultMapCollectionType, Function>(_defaultMap, targetClass, method, before)
    }

    private static addInstanceBase(_instanceMap: InstanceMapCollectionType, instance: Object, method: string | symbol, before: (...args: any[]) => any) {
        GPTPlugin.addBase<InstanceMapCollectionType, Object>(_instanceMap, instance, method, before)
    }

    static getInstanceBase(_instanceMap: InstanceMapCollectionType, instance: Object, method: string | symbol): (...args: any) => any {
        const instanceMap = _instanceMap.get(instance)
        if (!instanceMap) return []
        return instanceMap.get(method) || []
    }

    private static removeBase<T1, T2>(_defaultMap: T1, targetClass: T2, method: string | symbol, before: (...args: any[]) => any) {
        const classMap = _defaultMap.get(targetClass)
        if (classMap) {
            const befores = classMap.get(method)
            if (befores) {
                const index = befores.indexOf(before)
                if (index !== -1) {
                    befores.splice(index, 1)
                }
            }
        }
    }

    private static removeDefaultBase(_defaultMap: DefaultMapCollectionType, targetClass: Function, method: string | symbol, before: (...args: any[]) => any) {
        GPTPlugin.removeBase<DefaultMapCollectionType, Function>(_defaultMap, targetClass, method, before)
    }

    private static removeInstanceBase<InstanceMapCollectionType, Object>(_instanceMap: InstanceMapCollectionType, instance: Object, method: string | symbol, before: (...args: any[]) => any) {
        GPTPlugin.removeBase(_instanceMap, instance, method, before)
    }

    private static addDefaultBefore(targetClass: Function, method: string | symbol, before: (...args: any) => any): void {
        GPTPlugin.addDefaultBase(this._defaultBefores, targetClass, method, before)
    }

    private static addDefaultAfter(targetClass: Function, method: string | symbol, after: (...args: any) => any): void {
        GPTPlugin.addDefaultBase(this._defaultAfters, targetClass, method, after)
    }

    private static addInstanceBefore(instance: Object, method: string | symbol, before: (...args: any) => any): void {
        GPTPlugin.addInstanceBase(this._instanceBefores, instance, method, before)
    }

    private static addInstanceAfter(instance: Object, method: string | symbol, after: (...args: any) => any): void {
        GPTPlugin.addInstanceBase(this._instanceAfters, instance, method, after)
    }

    static add(target: Function | Object, method: string | symbol, when: "Before" | "After", callback: (...args: any) => any): void {
        if (false) "N/A"
        else if (when === 'Before' && target instanceof Function) GPTPlugin.addDefaultBefore(target, method, callback)
        else if (when === 'After' && target instanceof Function) GPTPlugin.addDefaultAfter(target, method, callback)
        else if (when === 'Before' && target instanceof Object) GPTPlugin.addInstanceBefore(target, method, callback)
        else if (when === 'After' && target instanceof Object) GPTPlugin.addInstanceAfter(target, method, callback)
        else throw new GPTPluginError("Unsupported plugin configuration")
    }

    static getDefaultBefores(targetClass: Function, method: string | symbol): (...args: any) => any {
        return this._getMap(this._defaultBefores, targetClass, method)
    }

    static getDefaultAfters(targetClass: Function, method: string | symbol): (...args: any) => any {
        return this._getMap(this._defaultAfters, targetClass, method)
    }

    static getInstanceBefores(instance: Object, method: string | symbol): (...args: any) => any {
        return this.getInstanceBase(this._instanceBefores, instance, method)
    }

    static getInstanceAfters(instance: Object, method: string | symbol): (...args: any) => any {
        return this.getInstanceBase(this._instanceAfters, instance, method)
    }

    static removeDefaultBefore(targetClass: Function, method: string | symbol, before: (...args: any) => any): void {
        GPTPlugin.removeDefaultBase(this._defaultBefores, targetClass, method, before)
    }

    static removeDefaultAfter(targetClass: Function, method: string | symbol, after: (...args: any) => any): void {
        GPTPlugin.removeDefaultBase(this._defaultAfters, targetClass, method, after)
    }

    static removeInstanceBefore(instance: Object, method: string | symbol, before: (...args: any) => any): void {
        GPTPlugin.removeInstanceBase(this._instanceBefores, instance, method, before)
    }

    static removeInstanceAfter(instance: Object, method: string | symbol, after: (...args: any) => any): void {
        GPTPlugin.removeInstanceBase(this._instanceAfters, instance, method, after)
    }

    static getAllDefaultBefores(): DefaultMapType {
        return this._defaultBefores
    }

    static getAllInstanceBefores(): InstanceMapType {
        return this._instanceBefores
    }

    static getDefaultBeforesForClass(targetClass: Function): Map<string | symbol, (...args: any) => any>[] | undefined {
        return this._defaultBefores.get(targetClass)
    }

    static getBeforesForInstance(instance: Object): Map<string | symbol, (...args: any) => any>[] | undefined {
        return this._instanceBefores.get(instance)
    }

    static getAllDefaultAfters(): DefaultMapType {
        return this._defaultAfters
    }

    static getAllInstanceAfters(): InstanceMapType {
        return this._instanceAfters
    }

    static getDefaultAftersForClass(targetClass: Function): Map<string | symbol, (...args: any) => any>[] | undefined {
        return this._defaultAfters.get(targetClass)
    }

    static getAftersForInstance(instance: Object): Map<string | symbol, (...args: any) => any>[] | undefined {
        return this._instanceAfters.get(instance)
    }

    static copyInstanceBefores(from: Object, to: Object): (...args: any) => void {
        const instanceMap = this._instanceBefores.get(from)
        this._instanceBefores.set(to, instanceMap?.copyWithin(-1))
    }

    static copyInstanceAfters(from: Object, to: Object): (...args: any) => void {
        const instanceMap = this._instanceAfters.get(from)
        this._instanceAfters.set(to, instanceMap?.copyWithin(-1))
    }
}

export function Before(): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value
        descriptor.value = async function (...args: any) {
            const targetClass = this.constructor
            const defaultBefores = GPTPlugin.getDefaultBefores(targetClass, propertyKey)
            const instanceBefores = GPTPlugin.getInstanceBefores(this, propertyKey)
            const allCallbacks = [...defaultBefores, ...instanceBefores]

            for (const callback of allCallbacks) {
                const newArgs = await callback(...args)
                if (newArgs !== undefined)
                    args = newArgs
            }
            let newLocal
            newLocal = await originalMethod.apply(this, args)
            return newLocal
        }
        return descriptor
    }

}

export function After(): MethodDecorator {
    return (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value
        descriptor.value = async function (...args: any[]) {
            const targetClass = this.constructor
            const defaultAfters = GPTPlugin.getDefaultAfters(targetClass, propertyKey)
            const instanceAfters = GPTPlugin.getInstanceAfters(this, propertyKey)
            const allCallbacks = [...defaultAfters, ...instanceAfters]
            const originalResult = await originalMethod.apply(this, args)
            let modifiedResult = originalResult
            for (const callback of allCallbacks) {
                let newModifiedResult
                newModifiedResult = await callback(modifiedResult)
                if (newModifiedResult !== undefined) modifiedResult = newModifiedResult
            }
            return modifiedResult
        }
        return descriptor
    }
}
