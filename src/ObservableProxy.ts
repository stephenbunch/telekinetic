import { KeyedDependency } from './internal/KeyedDependency';
import { Uri } from './Uri';

class ObservableProxyHandler<T extends KeyedObject> implements ProxyHandler<T> {
  private dependencies: KeyedDependency;

  constructor(uri: Uri) {
    this.dependencies = new KeyedDependency(uri);
  }

  get(target: T, key: PropertyKey, receiver: any): any {
    this.dependencies.depend(key);
    return target[key];
  }

  set(target: T, key: PropertyKey, value: any, receiver: any): boolean {
    // Only update if the value is different.
    if (value !== target[key]) {
      target[key] = value;
      this.dependencies.changed(key);
    }
    return true;
  }
}

export type KeyedObject = { [index: string]: any };

export class ObservableProxy {
  /**
   * Creates a new reactive proxy from an existing object. The original object
   * is not used. To convert back to the original object, use toObject.
   * @param {T} target The object from which to create the proxy.
   */
  static wrap<T extends KeyedObject>(uri: Uri, target: T): T {
    return new Proxy(target, new ObservableProxyHandler<T>(uri));
  }

  private constructor() { }
}
