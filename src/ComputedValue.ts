import { ComputationContext } from './ComputationContext';
import { Dependency } from './Dependency';
import { getCurrent, Computation } from './Computation';
import { Input } from './Input';
import { Value } from './Value';

function disposePreviousValue<T>(prevValue: T, nextValue: T) {
  const val = prevValue as any;
  if (val && val.dispose && typeof val.dispose === 'function') {
    val.dispose();
  }
}

export class ComputedValue<T> implements Input<T> {
  readonly name: string;

  private readonly runFunc: (context?: ComputationContext) => T;
  private readonly computation: Computation;
  private value: Value<T> | null = null;

  constructor(name: string, computation: Computation, runFunc: (context?: ComputationContext) => T) {
    this.name = name;
    this.computation = computation;
    this.runFunc = runFunc;
  }

  get() {
    if (!this.value) {
      this.computation.spawn(this.name, (context) => {
        const result = this.runFunc(context);
        if (!this.value) {
          this.value = new Value(this.name, result);
        } else {
          this.value.set(result);
        }
      });
    }
    return this.value!.get();
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
            this.cache.set(current,
              new Value(this.name, value, disposePreviousValue));
          }
        });
      }
      return this.cache.get(current)!.get();
    } else {
      return await this.runFunc();
    }
  }
}
