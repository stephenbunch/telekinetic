import { ComputationContextClass } from './ComputationContext';
import { getCurrent, ReentrancyError } from './Computation';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';
import { bound } from './bound';
import { Event, EventController } from './Event';
import { enqueue } from './transaction';

export class CircularDependencyError extends Error { }

export class Dependency {
  readonly name: string;

  private contexts = new OrderedSet<ComputationContextClass>();
  private readonly onActiveEvent = new EventController();
  private readonly onInactiveEvent = new EventController();
  private isActive = false;

  constructor(name: string) {
    this.name = name;
  }

  @bound
  private onContextDestroy(context: ComputationContextClass) {
    this.contexts.delete(context);
    this.checkInactive();
  }

  get onActive(): Event {
    return this.onActiveEvent;
  }

  get onInactive(): Event {
    return this.onInactiveEvent;
  }

  depend(): void {
    const computation = getCurrent();
    if (computation && computation.isAlive) {
      const context = computation.context!;
      context.track(this, this.onContextDestroy);
      this.contexts.add(context);
      if (!this.isActive) {
        this.isActive = true;
        this.onActiveEvent.trigger(null);
      }
      // Logger.current.trace(`${computation.name} depends on ${this.name}.`);
    }
  }

  changed(): void {
    // Logger.current.trace(`${this.name} changed.`);
    const contexts = this.contexts;
    this.contexts = new OrderedSet<ComputationContextClass>();
    const current = getCurrent();
    for (const context of contexts) {
      if (context.isAlive) {
        if (context.parents!.has(current!)) {
          throw new CircularDependencyError(
            `${this.name} was changed in autorun ` +
            `${current!.name} after being depended on.`
          );
        }
        try {
          context.computation!.rerun();
        } catch (err) {
          // If we get a reentrancy error, it's because another autorun which
          // depended on this value (directly or indirectly) triggered a change
          // in this autorun.
          if (err instanceof ReentrancyError) {
            throw new CircularDependencyError(
              `Changing ${this.name} caused another autorun to rerun ` +
              `which caused another change to this value.`
            );
          } else {
            throw err;
          }
        }
      }
    }
    this.checkInactive();
  }

  private checkInactive() {
    enqueue(() => {
      if (!this.isActive && this.contexts.size === 0) {
        this.isActive = false;
        this.onInactiveEvent.trigger(null);
      }
    }, this);
  }
}
