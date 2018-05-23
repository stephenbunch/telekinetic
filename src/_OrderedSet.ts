export class _OrderedSet<T> implements Iterable<T> {
  private itemSet: Set<T>;
  private items: Array<T>;

  constructor(values?: Iterable<T>) {
    if (values) {
      this.itemSet = new Set(values);
      this.items = Array.from(this.itemSet);
    } else {
      this.itemSet = new Set();
      this.items = [];
    }
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]();
  }

  get size(): number {
    return this.itemSet.size;
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  set(index: number, item: T) {
    if (index < this.items.length) {
      this.items[index] = item;
    }
  }

  has(item: T): boolean {
    return this.itemSet.has(item);
  }

  delete(item: T) {
    if (this.itemSet.has(item)) {
      this.itemSet.delete(item);
      this.items.splice(this.items.indexOf(item), 1);
    }
  }

  add(item: T) {
    if (!this.itemSet.has(item)) {
      this.itemSet.add(item);
      this.items.push(item);
    }
  }

  clone(): _OrderedSet<T> {
    const set = new _OrderedSet<T>();
    set.itemSet = new Set(this.itemSet);
    set.items = this.items.slice();
    return set;
  }

  indexOf(item: T) {
    return this.items.indexOf(item);
  }
}
