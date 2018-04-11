import { ComputationContext } from './ComputationContext';
import { Dependency } from './Dependency';
import { getCurrent, Computation } from './Computation';
import { Input } from './Input';
import { Value } from './Value';

export class ComputedValue<T> implements Input<T> {
  readonly name: string;

  private readonly runFunc: (comp?: ComputationContext) => T;
  private cache = new WeakMap<Computation, Value<T>>();

  constructor(name: string, runFunc: (comp?: ComputationContext) => T) {
    this.name = name;
    this.runFunc = runFunc;
  }

  get() {
    const current = getCurrent();
    if (current) {
      if (!this.cache.has(current)) {
        current.spawn(this.name, (context) => {
          const value = this.runFunc(context);
          if (this.cache.has(current)) {
            this.cache.get(current)!.set(value);
          } else {
            this.cache.set(current, new Value(this.name, value));
          }
        });
      }
      return this.cache.get(current)!.get();
    } else {
      return this.runFunc();
    }
  }
}

export class ComputedAsyncValueError extends Error { }

export class ComputedAsyncValue<T> implements Input<Promise<T>> {
  readonly name: string;

  private readonly runFunc: (comp?: ComputationContext) => T;
  private cache = new WeakMap<Computation, Value<T>>();

  constructor(name: string, runFunc: (comp?: ComputationContext) => T) {
    this.name = name;
    this.runFunc = runFunc;
  }

  async get() {
    const current = getCurrent();
    if (current) {
      if (!this.cache.has(current)) {
        await current.spawnAsync(this.name, async (context) => {
          const value = await this.runFunc(context);
          if (this.cache.has(current)) {
            this.cache.get(current)!.set(value);
          } else {
            this.cache.set(current, new Value(this.name, value));
          }
        });
      }
      return this.cache.get(current)!.get();
    } else {
      return await this.runFunc();
    }
  }
}
