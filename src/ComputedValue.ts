import { ComputationRef } from './ComputationRef';
import { Dependency } from './Dependency';
import { getCurrent } from './Computation';
import { Input } from './Input';

export class ComputedValue<T> implements Input<T> {
  readonly name: string;
  private readonly runFunc: (comp?: ComputationRef) => T;
  private dependency: Dependency;
  private cache = new WeakMap<ComputationRef, T>();

  constructor(name: string, runFunc: (comp?: ComputationRef) => T) {
    this.name = name;
    this.runFunc = runFunc;
    this.dependency = new Dependency(name);
  }

  get() {
    this.dependency.depend();
    const current = getCurrent();
    if (current && current.ref) {
      const ref = current.ref;
      if (!this.cache.has(ref)) {
        this.cache.set(ref, this.runFunc(ref));
      }
      return this.cache.get(ref)!;
    } else {
      return this.runFunc();
    }
  }
}

export class ComputedAsyncValueError extends Error { }

export class ComputedAsyncValue<T> implements Input<Promise<T>> {
  readonly name: string;
  private readonly runFunc: (comp?: ComputationRef) => T;
  private cache = new WeakMap<ComputationRef, T>();

  constructor(name: string, runFunc: (comp?: ComputationRef) => T) {
    this.name = name;
    this.runFunc = runFunc;
  }

  async get() {
    const current = getCurrent();
    if (current && current.ref) {
      const ref = current.ref;
      if (!this.cache.has(ref)) {
        this.cache.set(ref, await this.runFunc(ref));
      }
      return this.cache.get(ref)!;
    } else {
      return await this.runFunc();
    }
  }
}
