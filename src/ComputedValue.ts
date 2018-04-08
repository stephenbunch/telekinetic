import { ComputationRef } from './ComputationRef';
import { Dependency } from './Dependency';
import { getCurrent } from './Autorun';
import { Input } from './Input';

const cache = new WeakMap();

export class ComputedValue<T> implements Input<T> {
  readonly name: string;
  private readonly runFunc: (comp?: ComputationRef) => T;
  private dependency: Dependency;

  constructor(name: string, runFunc: (comp?: ComputationRef) => T) {
    this.name = name;
    this.runFunc = runFunc;
    this.dependency = new Dependency(name);
  }

  get() {
    this.dependency.depend();
    const current = getCurrent();
    if (current) {
      if (!cache.has(current)) {
        current.ref!.fork(this.name, (comp) => {
          const value = this.runFunc(comp);
          if (cache.has(current)) {
            if (cache.get(current) !== value) {
              cache.set(current, value);
              this.dependency.changed();
            }
          } else {
            cache.set(current, value);
          }
        });
      }
      return cache.get(current);
    } else {
      return this.runFunc();
    }
  }
}
