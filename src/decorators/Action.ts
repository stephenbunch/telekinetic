import { transaction } from '../transaction';
import { untracked } from '../Computation';

const __cache = Symbol('cache');

type AnyFunction = (...args: any[]) => any;

interface Host {
  [__cache]: Map<PropertyKey, AnyFunction>;
}

export const Action = (): MethodDecorator => (target: any, key: PropertyKey,
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
        this[__cache].set(key, (...args) => {
          return transaction(() => untracked(() => func.apply(this, args)));
        });
      }
      return this[__cache].get(key)!;
    }
  };
};
