import { getCurrent, ReentrancyError } from './Computation';
import { ComputationRefClass } from './ComputationRef';
import { OrderedSet } from './OrderedSet';
import { Logger } from './Logger';

export class CircularDependencyError extends Error { }

export class Dependency {
  private refs = new OrderedSet<ComputationRefClass>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  depend(): void {
    const computation = getCurrent();
    if (computation && computation.isAlive) {
      const ref = computation.ref!;
      this.refs.push(ref);
      if (ref.dependencies) {
        ref.dependencies.add(this.name);
      }
      Logger.current.trace(`${computation.name} depends on ${this.name}.`);
    }
  }

  changed(): void {
    Logger.current.trace(`${this.name} changed.`);
    const refs = this.refs;
    this.refs = new OrderedSet<ComputationRefClass>();
    const current = getCurrent();
    for (const ref of refs) {
      if (ref.isAlive) {
        if (ref.parents!.has(current!)) {
          throw new CircularDependencyError(
            `${this.name} was changed in autorun ` +
            `${current!.name} after being depended on.`
          );
        }
        try {
          ref.computation!.rerun();
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
