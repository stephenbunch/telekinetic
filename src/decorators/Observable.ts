import { KeyedDependency } from '../internal/KeyedDependency';
import { Name } from '../Name';

const STATE = Symbol('STATE');

const DEFAULT: PropertyDescriptor = {
  configurable: true,
  enumerable: true,
};

class ObservableState {
  dependencies: KeyedDependency;
  values = new Map<PropertyKey, any>();

  constructor(name: Name) {
    this.dependencies = new KeyedDependency(name);
  }
}

class ObservableHost {
  [STATE]: ObservableState | undefined;
}

function getState(obj: ObservableHost): ObservableState {
  if (!obj[STATE]) {
    if (obj.constructor) {
      obj[STATE] = new ObservableState(Name.of(obj.constructor.name));
    } else {
      obj[STATE] = new ObservableState(Name.of('$$object'));
    }
  }
  return obj[STATE]!;
}

function getValue(obj: ObservableHost,
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

function setValue(obj: ObservableHost,
  base: PropertyDescriptor | undefined, key: PropertyKey, value: any) {
  if (base && base.set) {
    base.set(value);
  } else {
    getState(obj).values.set(key, value);
  }
}

export const Observable = (): PropertyDecorator => (target: any,
  key: PropertyKey) => {
  const base = Object.getOwnPropertyDescriptor(target, key);
  const descriptor: PropertyDescriptor = { ...(base || DEFAULT) };
  if (descriptor.configurable) {
    if (!base ||
      base.get || Object.prototype.hasOwnProperty.call(base, 'value')) {
      descriptor.get = function (this: ObservableHost) {
        getState(this).dependencies.depend(key);
        return getValue(this, base, key);
      };
    }
    if (!base || base.set || base.writable) {
      descriptor.set = function (this: ObservableHost, value: any) {
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
};
