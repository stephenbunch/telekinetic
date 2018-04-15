import { ComputedValue } from './ComputedValue';
import { ComputationClass } from './Computation';

const values = new WeakMap<any, Map<PropertyKey, ComputedValue<any>>>();
const keys = new WeakMap<any, Array<PropertyKey>>();
export const __computation = Symbol('__computation');

export interface Observer {
  readonly [__computation]: ComputationClass<void>;
  dispose(): void;
}

export function computed(target: any, key: PropertyKey,
  descriptor: PropertyDescriptor): PropertyDescriptor {
  const get = descriptor.get!;
  descriptor.get = function (this: Observer) {
    if (!values.has(this)) {
      values.set(this, new Map());
    }
    const map = values.get(this)!;
    if (!map.has(key)) {
      map.set(key,
        new ComputedValue(key.toString(), this[__computation], get!.bind(this)));
    }
    return map.get(key)!.get();
  };
  if (!keys.has(target)) {
    keys.set(target, []);
  }
  keys.get(target)!.push(key);
  return descriptor;
}

export function observer<T extends { new(...args: any[]): {} }>(constructor: T) {
  return class extends constructor implements Observer {
    readonly [__computation]: ComputationClass<void>;

    constructor(...args: any[]) {
      super(...args);
      this[__computation] = new ComputationClass(constructor.name, () => { });
    }

    init() {
      for (const key of keys.get(constructor.prototype) || []) {
        (this as any)[key];
      }
    }

    dispose() {
      this[__computation].dispose();
    }
  }
}
