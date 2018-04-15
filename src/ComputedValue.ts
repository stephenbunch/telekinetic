import { ComputationContext } from './ComputationContext';
import { Dependency } from './Dependency';
import { getCurrent, Computation } from './Computation';
import { Input } from './Input';
import { Value } from './Value';
import { autorun } from './autorun';
import { enqueue } from './batch';

function disposePreviousValue<T>(prevValue: T, nextValue: T) {
  const val = prevValue as any;
  if (val && val.dispose && typeof val.dispose === 'function') {
    val.dispose();
  }
}

export class ComputedValue<T> implements Input<T> {
  readonly name: string;

  private readonly producer: () => T;
  private readonly dependency: Dependency;

  private value: T | undefined;
  private isCold = true;
  private hasSubscribers = false;

  constructor(name: string, producer: () => T) {
    this.name = name;
    this.dependency = new Dependency(name);
    this.producer = producer;
  }

  get() {
    this.dependency.depend();
    this.hasSubscribers = true;
    if (this.isCold) {
      const comp = autorun(this.name, (context) => {
        const value = this.producer();
        // console.log(this.name, context.getTrackedDependencies().map(x => x.name));
        if (this.isCold) {
          this.isCold = false;
          this.value = value;
        } else if (value !== this.value) {
          this.value = value;
          this.hasSubscribers = false;
          this.dependency.changed();
          enqueue(() => {
            if (!this.hasSubscribers) {
              comp.dispose();
              this.isCold = true;
              this.value = undefined;
            }
          }, this);
        }
      });
    }
    return this.value!;
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
