import { Computation, ComputationClass, RunFunction } from './Computation';
import { Disposable, DisposedError } from './Disposable';
import { FrozenSet } from './FrozenSet';
import { Dependency } from './Dependency';

const DESTROYED = 'Computation context has been destroyed.';

export type ComputationContextClassEventListener =
  (context: ComputationContextClass) => void;

export interface ComputationContext {
  readonly isAlive: boolean;
  continue<T>(callback: () => T): T;
  fork<T>(name: string, runFunc: RunFunction<T>): T;
  getTrackedDependencies(): Array<Dependency>;
}

export class ComputationContextClass implements ComputationContext, Disposable {
  private dependencies: Map<Dependency,
    ComputationContextClassEventListener> | null;
  private disposed = false;

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
    return !this.disposed;
  }

  track(dependency: Dependency,
    onDestroy: ComputationContextClassEventListener) {
    if (this.isAlive) {
      if (!this.dependencies!.has(dependency)) {
        this.dependencies!.set(dependency, onDestroy);
      }
    } else {
      throw new DisposedError(DESTROYED);
    }
  }

  continue<T>(callback: () => T): T {
    if (this.isAlive) {
      return this.computation!.continue(callback);
    } else {
      throw new DisposedError(DESTROYED);
    }
  }

  fork<T>(name: string, runFunc: RunFunction<T>): T {
    if (this.isAlive) {
      const fullName = `${this.computation!.name}.${name}`;
      const comp = new ComputationClass(fullName, runFunc, this);
      this.children!.push(comp);
      return comp.run();
    } else {
      throw new DisposedError(DESTROYED);
    }
  }

  dispose() {
    if (this.isAlive) {
      this.disposed = true;
      for (const callback of this.dependencies!.values()) {
        callback(this);
      }
      for (const child of this.children!) {
        child.dispose();
      }
      this.computation = null;
      this.parents = null;
      this.stack = null;
      this.dependencies = null;
      this.children = null;
    }
  }

  getTrackedDependencies(): Array<Dependency> {
    if (this.isAlive) {
      return Array.from(this.dependencies!.keys());
    } else {
      throw new DisposedError(DESTROYED);
    }
  }
}
