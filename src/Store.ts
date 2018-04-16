import { Event, EventController } from './Event';

export class Store<K, V> implements Iterable<[K, V]> {
  private store = new Map<K, V>();
  private onAddEvent = new EventController<[K, V]>();
  private onDeleteEvent = new EventController<[K, V]>();
  private onUpdateEvent = new EventController<[K, V]>();

  get onAdd(): Event<[K, V]> {
    return this.onAddEvent;
  }

  get onDelete(): Event<[K, V]> {
    return this.onDeleteEvent;
  }

  get onUpdate(): Event<[K, V]> {
    return this.onUpdateEvent;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.store[Symbol.iterator]();
  }

  entries(): Iterable<[K, V]> {
    return this.store.entries();
  }

  keys(): Iterable<K> {
    return this.store.keys();
  }

  values(): Iterable<V> {
    return this.store.values();
  }

  get(key: K): V | undefined {
    return this.store.get(key);
  }

  set(key: K, value: V) {
    if (this.store.has(key)) {
      this.store.set(key, value);
      this.onUpdateEvent.trigger([key, value]);
    } else {
      this.store.set(key, value);
      this.onAddEvent.trigger([key, value]);
    }
  }

  delete(key: K) {
    if (this.store.has(key)) {
      const value = this.store.get(key)!;
      this.store.delete(key);
      this.onDeleteEvent.trigger([key, value]);
    }
  }
}
