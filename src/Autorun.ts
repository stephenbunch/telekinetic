import Computation from './Computation';
import IAutorun from './IAutorun';
import OrderedSet from './OrderedSet';
import RunFunction from './RunFunction';

let currentAutorun: IAutorun | null = null;
let suspendCount = 0;
let suspendedAutoruns = new OrderedSet<IAutorun>();
const autorunStack = new OrderedSet<IAutorun>();
let uid = 0;

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

class Autorun<T> implements IAutorun {
  id: number;
  private func: RunFunction<T> | null;
  computation: Computation | null;
  private parentComputation: Computation | null;
  value: T | null;

  static get current(): IAutorun | null {
    return currentAutorun;
  }

  static start<TRunResult>(
    runFunc: RunFunction<TRunResult>): Autorun<TRunResult> {
    const autorun = new Autorun<TRunResult>(runFunc);
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

  constructor(runFunc: RunFunction<T>,
    parentComputation: Computation | null = null) {
    this.id = ++uid;
    this.func = runFunc;
    this.computation = null;
    this.parentComputation = parentComputation;
    this.value = null;
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
        result = this.exec(() => {
          const isFirstRun = this.computation === null;
          if (this.computation) {
            this.computation.dispose();
          }
          this.computation = new Computation(
            this, isFirstRun, autorunStack.clone());
          try {
            this.value = this.func!(this.computation);
          } catch (err) {
            this.dispose();
            throw err;
          }
          return this.value;
        });
      }
    }
    return result;
  }

  exec<TResult>(callback: () => TResult): TResult {
    if (currentAutorun) {
      autorunStack.push(currentAutorun!);
    }
    const current = currentAutorun;
    currentAutorun = this;
    try {
      return callback();
    } finally {
      currentAutorun = current;
      if (currentAutorun) {
        autorunStack.pop();
      }
    }
  }
}

export default Autorun;
