import { ComputedValue } from './ComputedValue';

const valuesByInstance = new WeakMap<any, Map<PropertyKey, ComputedValue<any>>>();

export function Computed(): MethodDecorator {
  return (target: any, key: PropertyKey,
    descriptor: PropertyDescriptor): PropertyDescriptor => {
    const get = descriptor.get!;
    descriptor.get = function () {
      if (!valuesByInstance.has(this)) {
        valuesByInstance.set(this, new Map());
      }
      const valuesByKey = valuesByInstance.get(this)!;
      if (!valuesByKey.has(key)) {
        const name = `${this.constructor.name}.${key}`;
        valuesByKey.set(key, new ComputedValue(name, get!.bind(this)));
      }
      return valuesByKey.get(key)!.get();
    };
    return descriptor;
  };
}
