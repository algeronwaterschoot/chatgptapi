"use strict";
/*
import { Aspect, Around, JoinPoint } from '@aspectjs/core';

@Aspect()
class PreprocessAspect {
    private static defaultCallbacks: Map<string, Function[]> = new Map();
    private static instanceCallbacks: WeakMap<Object, Map<string, Function[]>> = new WeakMap();

    @Around(on.method.withAnnotations(PreprocessArgs))
    async around(joinPoint: JoinPoint) {
        const method = joinPoint.target;
        const instance = joinPoint.instance;
        const args = joinPoint.args;

        const propertyKey = joinPoint.symbol.toString();

        const defaultCallbacks = PreprocessAspect.defaultCallbacks.get(propertyKey) || [];
        const instanceCallbacksMap = PreprocessAspect.instanceCallbacks.get(instance);
        const instanceCallbacks = instanceCallbacksMap?.get(propertyKey) || [];

        const allCallbacks = [...defaultCallbacks, ...instanceCallbacks];

        const processedArgs = await allCallbacks.reduce(async (accArgs, callback) => {
            const currentArgs = await accArgs;
            return callback(currentArgs);
        }, Promise.resolve(args));

        return method.call(instance, ...processedArgs);
    }

    static addDefaultCallback(methodName: string, callback: Function) {
        const callbacks = PreprocessAspect.defaultCallbacks.get(methodName) || [];
        callbacks.push(callback);
        PreprocessAspect.defaultCallbacks.set(methodName, callbacks);
    }

    static addInstanceCallback(instance: Object, methodName: string, callback: Function) {
        let instanceCallbacksMap = PreprocessAspect.instanceCallbacks.get(instance);
        if (!instanceCallbacksMap) {
            instanceCallbacksMap = new Map();
            PreprocessAspect.instanceCallbacks.set(instance, instanceCallbacksMap);
        }

        const callbacks = instanceCallbacksMap.get(methodName) || [];
        callbacks.push(callback);
        instanceCallbacksMap.set(methodName, callbacks);
    }
}
import { createAnnotation } from '@aspectjs/core';

const PreprocessArgs = createAnnotation();
*/ 
//# sourceMappingURL=AspectPlugin.js.map