import { OrderedSet } from './OrderedSet';

export type EventListener<T> = (eventArgs: T) => void;

export interface Event<T = null> {
  addListener(listener: EventListener<T>): void;
  removeListener(listener: EventListener<T>): void;
}

export class EventController<T = null> implements Event<T> {
  private listeners = new OrderedSet<EventListener<T>>();

  addListener(listener: EventListener<T>) {
    this.listeners.add(listener);
  }

  removeListener(listener: EventListener<T>) {
    this.listeners.delete(listener);
  }

  trigger(eventArgs: T) {
    const listeners = this.listeners.clone();
    for (const listener of listeners) {
      listener(eventArgs);
    }
  }
}
