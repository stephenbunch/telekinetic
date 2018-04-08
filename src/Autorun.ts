import { ComputationRefClass, ComputationRef } from './ComputationRef';
import { FrozenSet } from './FrozenSet';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';

let currentComputation: Computation | null = null;
let suspendCount = 0;
let suspendedAutoruns = new OrderedSet<Computation>();
let computationStack = new Set<Computation>();

function suspend(): void {
  suspendCount += 1;
}

function resume(): void {
  if (suspendCount > 0) {
    suspendCount -= 1;
    if (suspendCount === 0) {
      const autoruns = suspendedAutoruns;
      suspendedAutoruns = new OrderedSet<Computation>();
      for (const autorun of autoruns) {
        autorun.rerun();
      }
    }
  }
}

export class ReentrancyError extends Error { }

export interface Computation {
  readonly name: string;
  readonly isAlive: boolean;
  readonly ref: ComputationRefClass | null;
  readonly parentRef: ComputationRefClass | null;
  continue<R>(callback: () => R): R;
  exec<R>(callback: () => R): R;
  rerun(): void;
  dispose(): void;
}

export type RunFunction<T> = (computation: ComputationRef) => T;

export function once<TResult>(callback: () => TResult): TResult {
  try {
    suspend();
    return callback();
  } finally {
    resume();
  }
}

export function onceAsync<TResult>(
  callback: () => Promise<TResult>): Promise<TResult> {
  suspend();
  return callback().then(result => {
    resume();
    return result;
  }, (err) => {
    resume();
    throw err;
  });
}

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
  readonly name: string;
  private func: RunFunction<T> | null;
  ref: ComputationRefClass | null = null;
  parentRef: ComputationRefClass | null;
  value: T | null = null;

  constructor(name: string, runFunc: RunFunction<T>,
    parentComputation: ComputationRefClass | null = null) {
    this.name = name;
    this.func = runFunc;
    this.parentRef = parentComputation;
  }

  get isAlive(): boolean {
    return this.func !== null;
  }

  dispose(): void {
    this.func = null;
    if (this.ref) {
      this.ref.dispose();
      this.ref = null;
    }
    this.parentRef = null;
  }

  rerun(): T | undefined {
    let result: T | undefined;
    if (this.func) {
      if (this.parentRef && !this.parentRef.isAlive) {
        this.dispose();
      } else if (suspendCount > 0) {
        suspendedAutoruns.push(this);
      } else {
        Logger.current.trace(`Starting ${this.name}.`);
        result = this.exec(() => {
          const stack = new FrozenSet(computationStack);
          if (this.ref) {
            this.ref = this.ref.reincarnate(stack);
          } else {
            this.ref = new ComputationRefClass(this, stack);
          }
          try {
            this.value = this.func!(this.ref);
          } catch (err) {
            this.dispose();
            throw err;
          }
          return this.value;
        });
        Logger.current.trace(`Finished ${this.name}.`);
      }
    }
    return result;
  }

  continue<R>(callback: () => R): R {
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

  exec<R>(callback: () => R): R {
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
    const current = currentComputation;
    currentComputation = this;
    try {
      return callback();
    } finally {
      currentComputation = current;
      if (currentComputation) {
        computationStack.delete(currentComputation);
      }
    }
  }
}
