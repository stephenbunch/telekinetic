import KeyedDependency from './KeyedDependency';
import KeyedObject from './KeyedObject';

const PROXY_TARGET = Symbol('PROXY_TARGET');

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object';
}

class ReactiveProxyHandler<T extends KeyedObject> implements ProxyHandler<T> {
  dependencies = new KeyedDependency();
  readonly: boolean;
  initialized = false;

  constructor(readonly: boolean) {
    this.readonly = readonly;
  }

  get(target: T, key: PropertyKey, receiver: any): any {
    this.dependencies.depend(key);
    return target[key];
  }

  set(target: T, key: PropertyKey, value: any, receiver: any): boolean {
    if (key === PROXY_TARGET) {
      target[PROXY_TARGET] = value;
      return true;
    } else {
      if (this.readonly) {
        return false;
      } else {
        if (this.initialized) {
          if (value !== target[key]) {
            if (isObject(value)) {
              value = ReactiveProxy.create(value);
            }
            target[key] = value;
            this.dependencies.changed(key);
          }
        } else {
          if (isObject(value)) {
            target[key] = ReactiveProxy.create(value);
          }
        }
        return true;
      }
    }
  }
}

class ReactiveProxy {
  static create<T extends KeyedObject>(obj: T, readonly = false): T {
    if (!obj[PROXY_TARGET]) {
      const handler = new ReactiveProxyHandler<T>(readonly);
      const proxy = new Proxy(obj, handler);
      proxy[PROXY_TARGET] = obj;
      for (const key of Object.keys(obj)) {
        proxy[key] = obj[key];
      }
      handler.initialized = true;
      return proxy;
    } else {
      return obj;
    }
  }

  static toObject<T extends KeyedObject>(obj: T) : T {
    if (obj[PROXY_TARGET]) {
      obj = obj[PROXY_TARGET];
    }
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (isObject(value)) {
        obj[key] = this.toObject(value);
      } else {
        obj[key] = value;
      }
    }
    return obj;
  }

  private constructor() {}
}

export default ReactiveProxy;
