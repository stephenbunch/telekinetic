import isObject from './isObject';
import KeyedDependency from './KeyedDependency';
import KeyedObject from './KeyedObject';

const PROXY_TARGET = Symbol('PROXY_TARGET');

class ReactiveProxyHandler<T extends KeyedObject> implements ProxyHandler<T> {
  private dependencies = new KeyedDependency();

  get(target: T, key: PropertyKey, receiver: any): any {
    this.dependencies.depend(key);
    return target[key];
  }

  set(target: T, key: PropertyKey, value: any, receiver: any): boolean {
    if (key === PROXY_TARGET) {
      // Always allow setting the proxy target. This is a private member.
      target[PROXY_TARGET] = value;
      return true;
    } else {
      // Only update if the value is different.
      if (value !== target[key]) {
        if (isObject(value)) {
          // If the value is an object, wrap it in a proxy.
          value = ReactiveProxy.from(value);
        }
        target[key] = value;
        this.dependencies.changed(key);
      }
      return true;
    }
  }
}

class ReactiveProxy {
  /**
   * Creates a new reactive proxy from an existing object. The original object
   * is not used. To convert back to the original object, use toObject.
   * @param {T} obj The object from which to create the proxy.
   */
  static from<T extends KeyedObject>(obj: T): T {
    // We'll know if the object is already a proxy if the PROXY_TARGET member
    // exists.
    if (!obj[PROXY_TARGET]) {
      const target = Object.create(obj);
      const proxy = new Proxy(target, new ReactiveProxyHandler<T>());
      proxy[PROXY_TARGET] = target;
      // Also wrap each nested object in a proxy.
      for (const key of Object.keys(obj)) {
        let value = obj[key];
        if (isObject(value)) {
          value = this.from(value);
        }
        Object.defineProperty(target, key, {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      return proxy;
    } else {
      return obj;
    }
  }

  /**
   * Converts a reactive proxy back into a normal object.
   * @param {T} obj Presumably the proxy object.
   */
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
