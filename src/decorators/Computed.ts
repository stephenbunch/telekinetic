import { ComputedValue } from '../ComputedValue';
import { Uri } from '../Uri';

const valuesByInstance = new WeakMap<any,
  Map<PropertyKey, ComputedValue<any>>>();

export const Computed = (): MethodDecorator => (target: any, key: PropertyKey,
  descriptor: PropertyDescriptor): PropertyDescriptor => {
  if (typeof descriptor.value === 'function' &&
    (descriptor.value as Function).length > 0) {
    throw new Error(
      'When using @Computed on a method, the method may not have any ' +
      'parameters.'
    );
  }
  const func = (descriptor.value || descriptor.get) as Function;
  const action = function (this: any) {
    if (!valuesByInstance.has(this)) {
      valuesByInstance.set(this, new Map());
    }
    const valuesByKey = valuesByInstance.get(this)!;
    if (!valuesByKey.has(key)) {
      const uri = Uri.create(this.constructor.name, key.toString());
      valuesByKey.set(key, new ComputedValue(uri, func.bind(this)));
    }
    return valuesByKey.get(key)!.get();
  };
  if (descriptor.value) {
    descriptor.value = action;
  } else {
    descriptor.get = action;
  }
  return descriptor;
};
