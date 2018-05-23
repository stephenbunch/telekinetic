export class _FrozenSet<T> implements Set<T> {
  private readonly set: Set<T>;

  constructor(values?: Iterable<T>) {
    this.set = new Set(values || []);
  }

  get [Symbol.toStringTag](): 'Set' {
    return 'Set';
  }

  get size(): number {
    return this.set.size;
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.set[Symbol.iterator]();
  }

  has(value: T): boolean {
    return this.set.has(value);
  }

  add(value: T): this {
    throw new Error('Set is frozen.');
  }

  delete(value: T): boolean {
    throw new Error('Set is frozen.');
  }

  clear() {
    throw new Error('Set is frozen.');
  }

  entries(): IterableIterator<[T, T]> {
    return this.set.entries();
  }

  keys(): IterableIterator<T> {
    return this.set.keys();
  }

  values(): IterableIterator<T> {
    return this.set.values();
  }

  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any) {
    this.set.forEach(callbackfn);
  }
}
