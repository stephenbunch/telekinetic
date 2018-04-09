import { Computation, ComputationClass, RunFunction } from './Computation';
import { DisposedError } from './DisposedError';
import { FrozenSet } from './FrozenSet';

const DISPOSED = 'The computation reference has been disposed.';

export interface ComputationRef {
  readonly isAlive: boolean;
  continue<T>(callback: () => T): T;
  fork<T>(name: string, runFunc: RunFunction<T>): T;
  collectDependencies(): Set<string>;
}

export class ComputationRefClass {
  readonly name: string;
  computation: Computation | null;
  parents: FrozenSet<Computation> | null;
  stack: FrozenSet<Computation> | null;
  dependencies: Set<string> | undefined;

  constructor(computation: Computation, stack: FrozenSet<Computation>) {
    this.name = computation.name;
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

  continue<T>(callback: () => T): T {
    if (this.computation) {
      return this.computation.continue(callback);
    } else {
      throw new DisposedError(DISPOSED);
    }
  }

  fork<T>(name: string, runFunc: RunFunction<T>): T {
    if (this.computation) {
      const fullName = `${this.computation.name}.${name}`;
      return new ComputationClass(fullName, runFunc, this).run();
    } else {
      throw new DisposedError(DISPOSED);
    }
  }

  dispose() {
    this.computation = null;
    this.parents = null;
    this.stack = null;
  }

  reincarnate(stack: FrozenSet<Computation>): ComputationRefClass {
    // Reincarnate essentially clones the ref object and nulls the previous ref.
    // A ref is like a surrogate. Rather than track dependencies on the
    // computation itself, dependencies are tracked on the ref object so
    // that when a computation is rerun, old dependencies can be cleaned up in
    // constant time. When a dependency is changed, only live refs are used.
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
