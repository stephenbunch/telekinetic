import { OrderedSet } from './OrderedSet';

export type EventListener<T> = (eventArgs: T) => void;

export interface Event<T> {
  addListener(listener: EventListener<T>): void;
  removeListener(listener: EventListener<T>): void;
}

export class EventController<T> {
  private listeners = new OrderedSet<EventListener<T>>();

  get event(): Event<T> {
    return this;
  }

  addListener(listener: EventListener<T>) {
    this.listeners.push(listener);
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
