import { ComputationClass, Computation } from './Computation';
import { FrozenSet } from './FrozenSet';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';

let currentAutorun: IAutorun | null = null;
let suspendCount = 0;
let suspendedAutoruns = new OrderedSet<IAutorun>();
let autorunStack = new Set<IAutorun>();

function suspend(): void {
  suspendCount += 1;
}

function resume(): void {
  if (suspendCount > 0) {
    suspendCount -= 1;
    if (suspendCount === 0) {
      const autoruns = suspendedAutoruns;
      suspendedAutoruns = new OrderedSet<IAutorun>();
      for (const autorun of autoruns) {
        autorun.rerun();
      }
    }
  }
}

export class ReentrancyError extends Error { }

export interface IAutorun {
  readonly name: string;
  readonly isAlive: boolean;
  readonly computation: ComputationClass | null;
  readonly parent: IAutorun | null;
  continue<R>(callback: () => R): R;
  exec<R>(callback: () => R): R;
  rerun(): void;
  dispose(): void;
}

export type RunFunction<T> = (computation: Computation) => T;

export class Autorun<T> implements IAutorun {
  readonly name: string;
  private func: RunFunction<T> | null;
  computation: ComputationClass | null = null;
  private parentComputation: ComputationClass | null;
  value: T | null = null;

  static get current(): IAutorun | null {
    return currentAutorun;
  }

  static start<TRunResult>(name: string,
    runFunc: RunFunction<TRunResult>): Autorun<TRunResult> {
    const autorun = new Autorun<TRunResult>(name, runFunc);
    autorun.rerun();
    return autorun;
  }

  static once<TResult>(callback: () => TResult): TResult {
    try {
      suspend();
      return callback();
    } finally {
      resume();
    }
  }

  static onceAsync<TResult>(
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

  static exclude<TResult>(callback: () => TResult): TResult {
    const current = currentAutorun;
    currentAutorun = null;
    const result = callback();
    currentAutorun = current;
    return result;
  }

  constructor(name: string, runFunc: RunFunction<T>,
    parentComputation: ComputationClass | null = null) {
    this.name = name;
    this.func = runFunc;
    this.parentComputation = parentComputation;
  }

  get parent(): IAutorun | null {
    return this.parentComputation && this.parentComputation.autorun;
  }

  get isAlive(): boolean {
    return this.func !== null;
  }

  dispose(): void {
    this.func = null;
    if (this.computation) {
      this.computation.dispose();
      this.computation = null;
    }
    this.parentComputation = null;
  }

  rerun(): T | undefined {
    let result: T | undefined;
    if (this.func) {
      if (this.parentComputation && !this.parentComputation.isAlive) {
        this.dispose();
      } else if (suspendCount > 0) {
        suspendedAutoruns.push(this);
      } else {
        Logger.current.trace(`Starting ${this.name}.`);
        result = this.exec(() => {
          const stack = new FrozenSet(autorunStack);
          if (this.computation) {
            this.computation = this.computation.reincarnate(stack);
          } else {
            this.computation = new ComputationClass(this,
              this.parentComputation, stack);
          }
          try {
            this.value = this.func!(this.computation);
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
    const current = currentAutorun;
    const currentStack = autorunStack;
    currentAutorun = this;
    autorunStack = new Set(this.computation!.stack!);
    try {
      return callback();
    } finally {
      currentAutorun = current;
      autorunStack = currentStack;
    }
  }

  exec<R>(callback: () => R): R {
    if (currentAutorun) {
      if (currentAutorun === this || autorunStack.has(currentAutorun)) {
        throw new ReentrancyError(
          `Attempted to reenter ${currentAutorun.name}. Reentrancy not ` +
          `allowed.`
        );
      }
      autorunStack.add(currentAutorun!);
    }
    const current = currentAutorun;
    currentAutorun = this;
    try {
      return callback();
    } finally {
      currentAutorun = current;
      if (currentAutorun) {
        autorunStack.delete(currentAutorun);
      }
    }
  }
}
