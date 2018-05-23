const __cache = Symbol('cache');

type AnyFunction = (...args: any[]) => any;

interface Host {
  [__cache]: Map<PropertyKey, AnyFunction>;
}

export const _Bound = () => (target: any, key: PropertyKey,
  descriptor: PropertyDescriptor): PropertyDescriptor => {
  const func = target[key] as AnyFunction;
  return {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    get(this: Host): AnyFunction {
      if (!this[__cache]) {
        this[__cache] = new Map();
      }
      if (!this[__cache].has(key)) {
        this[__cache].set(key, func.bind(this));
      }
      return this[__cache].get(key)!;
    }
  };
};
