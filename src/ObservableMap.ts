import { Dependency } from './Dependency';
import { _KeyedDependency } from './_KeyedDependency';
import { transaction } from './transaction';
import { Uri } from './Uri';

export class ObservableMap<K, V> implements Map<K, V> {
  private map: Map<K, V>;
  private keysDependency: Dependency;
  private valuesDependency: Dependency;
  private dependencies: _KeyedDependency;

  static fromJS<K, V>(uri: Uri, map: Map<K, V>): ObservableMap<K, V> {
    return new ObservableMap<K, V>(uri, Array.from(map.entries()));
  }

  static toJS<K, V>(map: ObservableMap<K, V>): Map<K, V> {
    return new Map(Array.from(map.entries()));
  }

  constructor(uri: Uri, entries?: ReadonlyArray<[K, V]>) {
    this.keysDependency = new Dependency(uri.extend('$$keys'));
    this.valuesDependency = new Dependency(uri.extend('$$values'));
    this.dependencies = new _KeyedDependency(uri);
    this.map = new Map(entries);
  }

  get size(): number {
    this.keysDependency.depend();
    return this.map.size;
  }

  get [Symbol.toStringTag](): 'Map' {
    return this.map[Symbol.toStringTag];
  }

  has(key: K): boolean {
    this.keysDependency.depend();
    return this.map.has(key);
  }

  get(key: K): V | undefined {
    this.dependencies.depend(key);
    return this.map.get(key);
  }

  set(key: K, value: V): this {
    const isNew = !this.map.has(key);
    if (value !== this.map.get(key)) {
      this.map.set(key, value);
      transaction(() => {
        this.dependencies.changed(key);
        if (isNew) {
          this.keysDependency.changed();
        }
        this.valuesDependency.changed();
      });
    }
    return this;
  }

  delete(key: K): boolean {
    if (this.map.has(key)) {
      this.map.delete(key);
      transaction(() => {
        this.dependencies.changed(key);
        this.keysDependency.changed();
        this.valuesDependency.changed();
      });
      return true;
    } else {
      return false;
    }
  }

  keys(): IterableIterator<K> {
    this.keysDependency.depend();
    return this.map.keys();
  }

  values(): IterableIterator<V> {
    this.valuesDependency.depend();
    return this.map.values();
  }

  entries(): IterableIterator<[K, V]> {
    this.keysDependency.depend();
    this.valuesDependency.depend();
    return this.map.entries();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }

  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
    this.keysDependency.depend();
    this.valuesDependency.depend();
    this.map.forEach(callbackfn);
  }

  clear() {
    if (this.map.size > 0) {
      const keys = Array.from(this.map.keys());
      this.map.clear();
      transaction(() => {
        this.keysDependency.changed();
        this.valuesDependency.changed();
        for (const key of keys) {
          this.dependencies.changed(key);
        }
      });
    }
  }
}
