import { Autorun, IAutorun, RunFunction } from './Autorun';
import { FrozenSet } from './FrozenSet';

export interface Computation {
  readonly isFirstRun: boolean;
  readonly isAlive: boolean;
  continue<R>(callback: () => R): R | undefined;
  fork<R>(name: string, runFunc: RunFunction<R>): R | undefined;
  collectDependencies(): Set<string>;
}

export class ComputationClass {
  readonly isFirstRun = true;
  autorun: IAutorun | null;
  parents: FrozenSet<IAutorun> | null;
  stack: FrozenSet<IAutorun> | null;
  dependencies: Set<string> | undefined;

  constructor(autorun: IAutorun, parent: ComputationClass | null,
    stack: FrozenSet<IAutorun>) {
    this.autorun = autorun;
    this.stack = stack;
    if (parent) {
      const parents = new Set(parent.parents!);
      parents.add(parent.autorun!);
      this.parents = new FrozenSet(parents);
    } else {
      this.parents = new FrozenSet();
    }
  }

  get isAlive(): boolean {
    return this.autorun !== null;
  }

  continue<R>(callback: () => R): R | undefined {
    if (this.autorun) {
      return this.autorun.continue(callback);
    }
    return undefined;
  }

  fork<R>(name: string, runFunc: RunFunction<R>): R | undefined {
    if (this.autorun) {
      const autorun = new Autorun(`${this.autorun.name}.${name}`, runFunc, this);
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
    this.autorun = null;
    this.parents = null;
    this.stack = null;
  }

  reincarnate(stack: FrozenSet<IAutorun>): ComputationClass {
    // Reincarnate essentially clones the computation object and nulls the
    // previous object.
    // A computation is like a surrogate. Rather than track dependencies on the
    // autorun itself, dependencies are tracked on the computation object so
    // that when a computation is rerun, old dependencies can be cleaned up in
    // constant time. The actual cleanup occurs when a dependency is changed.
    // When a dependency is changed, only live computations are rerun.
    const comp = Object.create(ComputationClass.prototype);
    comp.isFirstRun = false;
    comp.autorun = this.autorun;
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
