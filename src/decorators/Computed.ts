import { ComputedValue } from '../ComputedValue';
import { Name } from '../Name';

const valuesByInstance = new WeakMap<any, Map<PropertyKey, ComputedValue<any>>>();

export const Computed = (): MethodDecorator => (target: any, key: PropertyKey,
  descriptor: PropertyDescriptor): PropertyDescriptor => {
  const get = descriptor.get!;
  descriptor.get = function () {
    if (!valuesByInstance.has(this)) {
      valuesByInstance.set(this, new Map());
    }
    const valuesByKey = valuesByInstance.get(this)!;
    if (!valuesByKey.has(key)) {
      const name = new Name([this.constructor.name, key.toString()]);
      valuesByKey.set(key, new ComputedValue(name, get!.bind(this)));
    }
    return valuesByKey.get(key)!.get();
  };
  return descriptor;
};
