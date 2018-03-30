import isObject from './isObject';
import KeyedDependency from './KeyedDependency';
import ReactiveProxy from './ReactiveProxy';

const STATE = Symbol('STATE');

const DEFAULT: PropertyDescriptor = {
  configurable: true,
  enumerable: true,
};

class TelekineticState {
  dependencies = new KeyedDependency();
  values = new Map<PropertyKey, any>();
}

class TelekineticObject {
  [STATE]: TelekineticState | undefined;
}

function getState(obj: TelekineticObject): TelekineticState {
  if (!obj[STATE]) {
    obj[STATE] = new TelekineticState();
  }
  return obj[STATE]!;
}

function getValue(obj: TelekineticObject,
  base: PropertyDescriptor | undefined, key: PropertyKey): any {
  if (base && base.get) {
    return base.get.call(obj);
  } else {
    const state = getState(obj);
    if (state.values.has(key)) {
      return state.values.get(key);
    } else if (base) {
      return base.value;
    } else {
      return undefined;
    }
  }
}

function setValue(obj: TelekineticObject,
  base: PropertyDescriptor | undefined, key: PropertyKey, value: any) {
  if (isObject(value)) {
    value = ReactiveProxy.from(value);
  }
  if (base && base.set) {
    base.set(value);
  } else {
    getState(obj).values.set(key, value);
  }
}

function telekinetic(target: any, key: PropertyKey) {
  const base = Object.getOwnPropertyDescriptor(target, key);
  const descriptor: PropertyDescriptor = {...(base || DEFAULT)};
  if (descriptor.configurable) {
    if (!base ||
      base.get || Object.prototype.hasOwnProperty.call(base, 'value')) {
      descriptor.get = function(this: TelekineticObject) {
        getState(this).dependencies.depend(key);
        return getValue(this, base, key);
      };
    }
    if (!base || base.set || base.writable) {
      descriptor.set = function(this: TelekineticObject, value: any) {
        const current = getValue(this, base, key);
        if (current !== value) {
          setValue(this, base, key, value);
          getState(this).dependencies.changed(key);
        }
      };
    }
    if (descriptor.get || descriptor.set) {
      delete descriptor.value;
      delete descriptor.writable;
    }
    Object.defineProperty(target, key, descriptor);
  }
}

export default telekinetic;
