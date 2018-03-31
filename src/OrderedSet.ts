class OrderedSet<T> {
  private set = new Set<T>();
  private items = new Array<T>();

  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]();
  }

  has(item: T): boolean {
    return this.set.has(item);
  }

  push(item: T) {
    if (!this.set.has(item)) {
      this.set.add(item);
      this.items.push(item);
    }
  }

  pop(): T | undefined {
    if (this.items.length > 0) {
      const item = this.items.pop();
      this.set.delete(item!);
      return item;
    }
    return undefined;
  }

  clone(): OrderedSet<T> {
    const set = new OrderedSet<T>();
    set.set = new Set(this.set);
    set.items = this.items.slice();
    return set;
  }
}

export default OrderedSet;
