import { Computation, ComputationClass, RunFunction } from './Computation';
import { Dependency } from './Dependency';
import { Disposable, DisposedError } from './Disposable';
import { Event, EventController } from './Event';
import { _FrozenSet } from './_FrozenSet';

const DESTROYED = 'Computation context has been destroyed.';

export interface ComputationContext {
  readonly isAlive: boolean;
  continue<T>(callback: () => T): T;
  fork<T>(name: string, runFunc: RunFunction<T>): T;
  getTrackedDependencies(): Array<Dependency>;
}

export class ComputationContextClass implements ComputationContext {
  private dependencies: Set<Dependency> | null;
  private destroyed = false;
  private onDestroyEvent = new EventController<ComputationContextClass>();

  readonly name: string;
  computation: Computation | null;
  parents: _FrozenSet<Computation> | null;
  stack: _FrozenSet<Computation> | null;
  children: Array<Computation> | null;

  constructor(computation: Computation, stack: _FrozenSet<Computation>) {
    this.name = computation.name;
    this.computation = computation;
    this.stack = stack;
    this.dependencies = new Set();
    this.children = [];
    if (computation.parentContext) {
      const parents = new Set(computation.parentContext.parents!);
      parents.add(computation.parentContext.computation!);
      this.parents = new _FrozenSet(parents);
    } else {
      this.parents = new _FrozenSet();
    }
  }

  get isAlive(): boolean {
    return !this.destroyed;
  }

  get onDestroy(): Event<ComputationContextClass> {
    return this.onDestroyEvent;
  }

  track(dependency: Dependency) {
    if (this.isAlive) {
      if (!this.dependencies!.has(dependency)) {
        this.dependencies!.add(dependency);
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

  destroy() {
    if (this.isAlive) {
      this.destroyed = true;
      this.onDestroyEvent.trigger(this);
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
      return Array.from(this.dependencies!);
    } else {
      throw new DisposedError(DESTROYED);
    }
  }
}
