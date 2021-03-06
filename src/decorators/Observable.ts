import { Uri } from '../Uri';
import { Value } from '../Value';

const valuesByInstance = new WeakMap<any, Map<PropertyKey, Value<any>>>();

function getValue(instance: object, key: PropertyKey, initialValue: any,
  persist: boolean): Value<any> {
  if (!valuesByInstance.has(instance)) {
    valuesByInstance.set(instance, new Map());
  }
  const valuesByKey = valuesByInstance.get(instance)!;
  if (!valuesByKey.has(key)) {
    const uri = Uri.fromClass(instance.constructor);
    valuesByKey.set(key, new Value(uri, initialValue, persist));
  }
  return valuesByKey.get(key)!
}

export const Observable = ({ persist = true } = {}): PropertyDecorator => (target: any,
  key: PropertyKey) => {
  const base = Object.getOwnPropertyDescriptor(target, key) || {};
  if (base.get || base.set) {
    throw new Error('@Observable may only be used on value properties.');
  }
  const initialValue = base.value;
  const descriptor = {
    configurable: true,
    enumerable: base.enumerable,
    get() {
      return getValue(this, key, initialValue, persist).get();
    },
    set(value: any) {
      getValue(this, key, initialValue, persist).set(value);
    },
  };
  Object.defineProperty(target, key, descriptor);
};
