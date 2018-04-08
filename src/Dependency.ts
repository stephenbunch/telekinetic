import { Autorun, ReentrancyError } from './Autorun';
import { ComputationClass } from './Computation';
import { OrderedSet } from './OrderedSet';
import { Logger } from './Logger';

export class CircularDependencyError extends Error { }

export class Dependency {
  private computations = new OrderedSet<ComputationClass>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  depend(): void {
    if (Autorun.current && Autorun.current.isAlive) {
      const comp = Autorun.current.computation!;
      this.computations.push(comp);
      if (comp.dependencies) {
        comp.dependencies.add(this.name);
      }
      Logger.current.trace(`${Autorun.current.name} depends on ${this.name}.`);
    }
  }

  changed(): void {
    Logger.current.trace(`${this.name} changed.`);
    const computations = this.computations;
    this.computations = new OrderedSet<ComputationClass>();
    for (const computation of computations) {
      if (computation.isAlive) {
        if (computation.parents!.has(Autorun.current!)) {
          throw new CircularDependencyError(
            `${this.name} was changed in autorun ` +
            `${Autorun.current!.name} after being depended on.`
          );
        }
        try {
          computation.autorun!.rerun();
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
