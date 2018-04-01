import { Autorun } from './Autorun';
import { Computation } from './Computation';
import { OrderedSet } from './OrderedSet';

export class Dependency {
  private computations = new OrderedSet<Computation>();

  depend(): void {
    if (Autorun.current && Autorun.current.isAlive) {
      this.computations.push(Autorun.current.computation!);
    }
  }

  changed(): void {
    const computations = this.computations;
    this.computations = new OrderedSet<Computation>();
    for (const computation of computations) {
      if (computation.isAlive) {
        if (
          computation.autorun === Autorun.current ||
          computation.stack!.has(Autorun.current!)
        ) {
          throw new Error('Circular dependencies are not allowed.');
        }
        computation.autorun!.rerun();
      }
    }
  }
}
