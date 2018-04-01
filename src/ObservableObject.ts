import { KeyedDependency } from './KeyedDependency';
import { observable, OBSERVABLE } from './observable';
import { ObservableMap } from './ObservableMap';
import { toJS, isObject } from './util';

const PROXY_TARGET = Symbol('PROXY_TARGET');

class ObservableProxyHandler<T extends KeyedObject> implements ProxyHandler<T> {
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
        target[key] = observable(value);
        this.dependencies.changed(key);
      }
      return true;
    }
  }
}

export type KeyedObject = { [index: string]: any };

export class ObservableObject {
  /**
   * Creates a new reactive proxy from an existing object. The original object
   * is not used. To convert back to the original object, use toObject.
   * @param {T} obj The object from which to create the proxy.
   */
  static fromJS<T extends KeyedObject>(obj: T): T {
    // We'll know if the object is already a proxy if the PROXY_TARGET member
    // exists.
    if (!obj[PROXY_TARGET]) {
      const target = Object.create(obj);
      const proxy = new Proxy(target, new ObservableProxyHandler<T>());
      proxy[PROXY_TARGET] = target;
      proxy[OBSERVABLE] = true;
      // Also wrap each nested object in a proxy.
      for (const key of Object.keys(obj)) {
        Object.defineProperty(target, key, {
          value: observable(obj[key]),
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

  static isObservable(obj: any): boolean {
    return isObject(obj) && !!obj[PROXY_TARGET];
  }

  /**
   * Converts a reactive proxy back into a normal object.
   * @param {T} obj Presumably the proxy object.
   */
  static toJS<T extends KeyedObject>(obj: T): T {
    if (obj[PROXY_TARGET]) {
      obj = obj[PROXY_TARGET];
      for (const key of Object.keys(obj)) {
        obj[key] = toJS(obj[key]);
      }
    }
    return obj;
  }

  private constructor() { }
}
