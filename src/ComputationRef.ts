import { ComputationClass, Computation, RunFunction } from './Computation';
import { FrozenSet } from './FrozenSet';

export interface ComputationRef {
  readonly isAlive: boolean;
  continue<R>(callback: () => R): R | undefined;
  fork<R>(name: string, runFunc: RunFunction<R>): R | undefined;
  collectDependencies(): Set<string>;
}

export class ComputationRefClass {
  computation: Computation | null;
  parents: FrozenSet<Computation> | null;
  stack: FrozenSet<Computation> | null;
  dependencies: Set<string> | undefined;

  constructor(computation: Computation, stack: FrozenSet<Computation>) {
    this.computation = computation;
    this.stack = stack;
    if (computation.parentRef) {
      const parents = new Set(computation.parentRef.parents!);
      parents.add(computation.parentRef.computation!);
      this.parents = new FrozenSet(parents);
    } else {
      this.parents = new FrozenSet();
    }
  }

  get isAlive(): boolean {
    return this.computation !== null;
  }

  continue<R>(callback: () => R): R | undefined {
    if (this.computation) {
      return this.computation.continue(callback);
    }
    return undefined;
  }

  fork<R>(name: string, runFunc: RunFunction<R>): R | undefined {
    if (this.computation) {
      const autorun = new ComputationClass(
        `${this.computation.name}.${name}`, runFunc, this);
      try {
        return autorun.rerun();
      } catch (err) {
        autorun.dispose();
        throw err;
      }
    }
    return undefined;
  }

  dispose() {
    this.computation = null;
    this.parents = null;
    this.stack = null;
  }

  reincarnate(stack: FrozenSet<Computation>): ComputationRefClass {
    // Reincarnate essentially clones the computation object and nulls the
    // previous object.
    // A computation is like a surrogate. Rather than track dependencies on the
    // autorun itself, dependencies are tracked on the computation object so
    // that when a computation is rerun, old dependencies can be cleaned up in
    // constant time. The actual cleanup occurs when a dependency is changed.
    // When a dependency is changed, only live computations are rerun.
    const comp =
      Object.create(ComputationRefClass.prototype) as ComputationRefClass;
    comp.computation = this.computation;
    comp.parents = this.parents;
    comp.stack = stack;
    this.dispose();
    return comp;
  }

  collectDependencies(): Set<string> {
    this.dependencies = new Set();
    return this.dependencies;
  }
}
