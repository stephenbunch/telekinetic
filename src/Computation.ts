import { Autorun } from './Autorun';
import {
  ComputationContext,
  ComputationContextClass,
} from './ComputationContext';
import { DisposedError } from './Disposable';
import { FrozenSet } from './FrozenSet';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';
import { batch, enqueue } from './batch';

let currentComputation: Computation | null = null;
let computationStack = new Set<Computation>();

const DISPOSED = 'Computation has been destroyed.';

export class ComputationError extends Error { }

export class ReentrancyError extends Error { }

export interface Computation extends Autorun {
  readonly name: string;
  readonly isAlive: boolean;
  readonly context: ComputationContextClass | null;
  readonly parentContext: ComputationContextClass | null;
  continue<R>(callback: () => R): R;
  spawn<R>(name: string, runFunc: RunFunction<R>): Computation;
  spawnAsync<R>(name: string,
    runFunc: RunFunction<Promise<R>>): Promise<Computation>;
  rerun(): void;
  dispose(): void;
}

export type RunFunction<T> = (computation: ComputationContext) => T;

export function untracked<TResult>(callback: () => TResult): TResult {
  const current = currentComputation;
  currentComputation = null;
  const result = callback();
  currentComputation = current;
  return result;
}

export function getCurrent(): Computation | null {
  return currentComputation;
}

export class ComputationClass<T> implements Computation {
  private func: RunFunction<T>;
  private disposed = false;
  private children: Computation[] = [];

  readonly name: string;
  context: ComputationContextClass | null = null;
  parentContext: ComputationContextClass | null;

  constructor(name: string, runFunc: RunFunction<T>,
    parentContext: ComputationContextClass | null = null) {
    this.name = name;
    this.func = runFunc;
    this.parentContext = parentContext;
  }

  get isAlive(): boolean {
    return !this.disposed;
  }

  dispose(): void {
    if (!this.disposed) {
      this.disposed = true;
      if (this.context) {
        this.context.dispose();
        this.context = null;
      }
      this.parentContext = null;
      for (const child of this.children) {
        child.dispose();
      }
      this.children = [];
    }
  }

  run(): T {
    if (this.disposed) {
      throw new DisposedError(DISPOSED);
    }
    if (this.context) {
      throw new ComputationError(
        'Computation has already been run once. Call rerun instead.');
    }
    return this.exec();
  }

  rerun() {
    if (this.disposed) {
      throw new DisposedError(DISPOSED);
    }
    const func = this.func;
    if (this.parentContext && !this.parentContext.isAlive) {
      this.dispose();
    } else {
      enqueue(() => this.isAlive && this.exec(), this);
    }
  }

  continue<R>(callback: () => R): R {
    if (this.disposed) {
      throw new DisposedError(DISPOSED);
    }
    const current = currentComputation;
    const currentStack = computationStack;
    currentComputation = this;
    computationStack = new Set(this.context!.stack!);
    try {
      return callback();
    } finally {
      currentComputation = current;
      computationStack = currentStack;
    }
  }

  spawn<R>(name: string, runFunc: RunFunction<R>): ComputationClass<R> {
    const comp = new ComputationClass(name, runFunc);
    this.children.push(comp);
    comp.run();
    return comp;
  }

  async spawnAsync<R>(name: string,
    runFunc: RunFunction<Promise<R>>): Promise<ComputationClass<Promise<R>>> {
    const comp = new ComputationClass(name, runFunc);
    this.children.push(comp);
    await comp.run();
    return comp;
  }

  private exec(): T {
    if (currentComputation) {
      if (currentComputation === this ||
        computationStack.has(currentComputation)) {
        throw new ReentrancyError(
          `Attempted to reenter ${currentComputation.name}. Reentrancy not ` +
          `allowed.`
        );
      }
      computationStack.add(currentComputation!);
    }
    Logger.current.trace(`Starting ${this.name}.`);
    const current = currentComputation;
    currentComputation = this;
    try {
      const stack = new FrozenSet(computationStack);
      if (this.context) {
        this.context.dispose();
      }
      this.context = new ComputationContextClass(this, stack);
      return this.func(this.context);
    } finally {
      currentComputation = current;
      if (currentComputation) {
        computationStack.delete(currentComputation);
      }
      Logger.current.trace(`Finished ${this.name}.`);
    }
  }
}
