import { Autorun } from './Autorun';
import { ComputationRefClass, ComputationRef } from './ComputationRef';
import { DisposedError } from './DisposedError';
import { FrozenSet } from './FrozenSet';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';

let currentComputation: Computation | null = null;
let suspendCount = 0;
let suspendedComputations = new OrderedSet<Computation>();
let computationStack = new Set<Computation>();

const DISPOSED = 'The computation has been disposed.';

export function suspend(): void {
  suspendCount += 1;
}

export function resume(): void {
  if (suspendCount > 0) {
    suspendCount -= 1;
    if (suspendCount === 0) {
      const computations = suspendedComputations;
      suspendedComputations = new OrderedSet<Computation>();
      for (const computation of computations) {
        computation.rerun();
      }
    }
  }
}

export class ComputationError extends Error { }

export class ReentrancyError extends Error { }

export interface Computation extends Autorun {
  readonly name: string;
  readonly isAlive: boolean;
  readonly ref: ComputationRefClass | null;
  readonly parentRef: ComputationRefClass | null;
  continue<R>(callback: () => R): R;
  rerun(): void;
  dispose(): void;
}

export type RunFunction<T> = (computation: ComputationRef) => T;

export function exclude<TResult>(callback: () => TResult): TResult {
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

  readonly name: string;
  ref: ComputationRefClass | null = null;
  parentRef: ComputationRefClass | null;

  constructor(name: string, runFunc: RunFunction<T>,
    parentRef: ComputationRefClass | null = null) {
    this.name = name;
    this.func = runFunc;
    this.parentRef = parentRef;
  }

  get isAlive(): boolean {
    return !this.disposed;
  }

  dispose(): void {
    if (!this.disposed) {
      this.disposed = true;
      if (this.ref) {
        this.ref.dispose();
        this.ref = null;
      }
      this.parentRef = null;
    }
  }

  run(): T {
    if (this.disposed) {
      throw new DisposedError(DISPOSED);
    }
    if (suspendCount > 0) {
      throw new ComputationError('Computations are currently suspended.');
    }
    if (this.ref) {
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
    if (this.parentRef && !this.parentRef.isAlive) {
      this.dispose();
    } else if (suspendCount > 0) {
      suspendedComputations.push(this);
    } else {
      this.exec();
    }
  }

  continue<R>(callback: () => R): R {
    if (this.disposed) {
      throw new DisposedError(DISPOSED);
    }
    const current = currentComputation;
    const currentStack = computationStack;
    currentComputation = this;
    computationStack = new Set(this.ref!.stack!);
    try {
      return callback();
    } finally {
      currentComputation = current;
      computationStack = currentStack;
    }
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
      if (this.ref) {
        this.ref = this.ref.reincarnate(stack);
      } else {
        this.ref = new ComputationRefClass(this, stack);
      }
      return this.func(this.ref);
    } finally {
      currentComputation = current;
      if (currentComputation) {
        computationStack.delete(currentComputation);
      }
      Logger.current.trace(`Finished ${this.name}.`);
    }
  }
}
