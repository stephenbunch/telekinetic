import { ComputationContextClass } from './ComputationContext';
import { getCurrent, ReentrancyError } from './Computation';
import { Logger } from './Logger';
import { OrderedSet } from './OrderedSet';
import { bound } from './bound';

export class CircularDependencyError extends Error { }

export class Dependency {
  private contexts = new OrderedSet<ComputationContextClass>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  @bound
  private onContextDestroy(context: ComputationContextClass) {
    this.contexts.delete(context);
  }

  depend(): void {
    const computation = getCurrent();
    if (computation && computation.isAlive) {
      const context = computation.context!;
      context.track(this, this.onContextDestroy);
      this.contexts.add(context);
      Logger.current.trace(`${computation.name} depends on ${this.name}.`);
    }
  }

  changed(): void {
    Logger.current.trace(`${this.name} changed.`);
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
  }
}
