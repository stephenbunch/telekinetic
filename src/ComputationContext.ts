import { Computation, ComputationClass, RunFunction } from './Computation';
import { DestroyedError } from './DisposedError';
import { FrozenSet } from './FrozenSet';
import { Dependency } from './Dependency';

const DESTROYED = 'Computation context has been destroyed.';

export type ComputationContextClassEventListener =
  (context: ComputationContextClass) => void;

export interface ComputationContext {
  readonly isAlive: boolean;
  continue<T>(callback: () => T): T;
  fork<T>(name: string, runFunc: RunFunction<T>): T;
  getTrackedDependencies(): Set<Dependency>;
}

export class ComputationContextClass {
  private dependencies: Map<Dependency,
    ComputationContextClassEventListener> | null;
  private destroyed = false;

  readonly name: string;
  computation: Computation | null;
  parents: FrozenSet<Computation> | null;
  stack: FrozenSet<Computation> | null;
  children: Array<Computation> | null;

  constructor(computation: Computation, stack: FrozenSet<Computation>) {
    this.name = computation.name;
    this.computation = computation;
    this.stack = stack;
    this.dependencies = new Map();
    this.children = [];
    if (computation.parentContext) {
      const parents = new Set(computation.parentContext.parents!);
      parents.add(computation.parentContext.computation!);
      this.parents = new FrozenSet(parents);
    } else {
      this.parents = new FrozenSet();
    }
  }

  get isAlive(): boolean {
    return !this.destroyed;
  }

  track(dependency: Dependency,
    onDestroy: ComputationContextClassEventListener) {
    if (this.isAlive) {
      if (!this.dependencies!.has(dependency)) {
        this.dependencies!.set(dependency, onDestroy);
      }
    } else {
      throw new DestroyedError(DESTROYED);
    }
  }

  continue<T>(callback: () => T): T {
    if (this.isAlive) {
      return this.computation!.continue(callback);
    } else {
      throw new DestroyedError(DESTROYED);
    }
  }

  fork<T>(name: string, runFunc: RunFunction<T>): T {
    if (this.isAlive) {
      const fullName = `${this.computation!.name}.${name}`;
      const comp = new ComputationClass(fullName, runFunc, this);
      this.children!.push(comp);
      return comp.run();
    } else {
      throw new DestroyedError(DESTROYED);
    }
  }

  destroy() {
    if (this.isAlive) {
      this.destroyed = true;
      for (const callback of this.dependencies!.values()) {
        callback(this);
      }
      for (const child of this.children!) {
        child.destroy();
      }
      this.computation = null;
      this.parents = null;
      this.stack = null;
      this.dependencies = null;
      this.children = null;
    }
  }

  getTrackedDependencies(): Set<Dependency> {
    if (this.isAlive) {
      return new Set(this.dependencies!.keys());
    } else {
      throw new DestroyedError(DESTROYED);
    }
  }
}
