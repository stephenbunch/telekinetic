import { Dependency } from './Dependency';
import { Uri } from './Uri';

export class ObservableSet<T> implements Set<T> {
  private set: Set<T>;
  private dependency: Dependency;

  constructor(uri: Uri, values?: Iterable<T>) {
    this.dependency = new Dependency(uri);
    if (values) {
      this.set = new Set(values);
    } else {
      this.set = new Set();
    }
  }

  get [Symbol.toStringTag](): 'Set' {
    return 'Set';
  }

  get size(): number {
    this.dependency.depend();
    return this.set.size;
  }

  [Symbol.iterator](): IterableIterator<T> {
    this.dependency.depend();
    return this.set[Symbol.iterator]();
  }

  has(value: T): boolean {
    this.dependency.depend();
    return this.set.has(value);
  }

  add(value: T): this {
    if (!this.set.has(value)) {
      this.set.add(value);
      this.dependency.changed();
    }
    return this;
  }

  delete(value: T): boolean {
    if (this.set.has(value)) {
      this.set.delete(value);
      this.dependency.changed();
      return true;
    }
    return false;
  }

  clear() {
    this.set.clear();
    this.dependency.changed();
  }

  entries(): IterableIterator<[T, T]> {
    this.dependency.depend();
    return this.set.entries();
  }

  keys(): IterableIterator<T> {
    this.dependency.depend();
    return this.set.keys();
  }

  values(): IterableIterator<T> {
    this.dependency.depend();
    return this.set.values();
  }

  forEach(
    callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) {
    this.dependency.depend();
    this.set.forEach(callbackfn);
  }
}
