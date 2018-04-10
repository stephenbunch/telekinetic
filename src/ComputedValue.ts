import { ComputationRef } from './ComputationRef';
import { Dependency } from './Dependency';
import { getCurrent, Computation } from './Computation';
import { Input } from './Input';

export class ComputedValue<T> implements Input<T> {
  readonly name: string;
  private readonly runFunc: (comp?: ComputationRef) => T;
  private dependency: Dependency;
  private cache = new WeakMap<Computation, T>();

  constructor(name: string, runFunc: (comp?: ComputationRef) => T) {
    this.name = name;
    this.runFunc = runFunc;
    this.dependency = new Dependency(name);
  }

  get() {
    this.dependency.depend();
    const current = getCurrent();
    if (current) {
      if (!this.cache.has(current)) {
        current.spawn(this.name, (ref) => {
          const value = this.runFunc(ref);
          if (this.cache.has(current)) {
            if (value !== this.cache.get(current)) {
              this.cache.set(current, value);
              this.dependency.changed();
            }
          } else {
            this.cache.set(current, value);
          }
        });
      }
      return this.cache.get(current)!;
    } else {
      return this.runFunc();
    }
  }
}

export class ComputedAsyncValueError extends Error { }

export class ComputedAsyncValue<T> implements Input<Promise<T>> {
  readonly name: string;
  private readonly runFunc: (comp?: ComputationRef) => T;
  private cache = new WeakMap<Computation, T>();
  private dependency: Dependency;

  constructor(name: string, runFunc: (comp?: ComputationRef) => T) {
    this.name = name;
    this.runFunc = runFunc;
    this.dependency = new Dependency(name);
  }

  async get() {
    this.dependency.depend();
    const current = getCurrent();
    if (current) {
      if (!this.cache.has(current)) {
        await current.spawn(this.name, async (ref) => {
          const value = await this.runFunc(ref);
          if (this.cache.has(current)) {
            if (value !== this.cache.get(current)) {
              this.cache.set(current, value);
              this.dependency.changed();
            }
          } else {
            this.cache.set(current, value);
          }
        });
      }
      return this.cache.get(current)!;
    } else {
      return await this.runFunc();
    }
  }
}
