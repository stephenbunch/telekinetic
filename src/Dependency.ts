import Autorun from './Autorun';
import Computation from './Computation';

export default class Dependency {
  private computations: Computation[] = [];

  depend(): void {
    if (Autorun.current && Autorun.current.isAlive) {
      if (this.computations.indexOf(Autorun.current.computation!) === -1) {
        this.computations.push(Autorun.current.computation!);
      }
    }
  }

  changed(): void {
    const computations = this.computations;
    this.computations = [];
    for (const computation of computations) {
      if (computation.isAlive) {
        if (
          computation.autorun === Autorun.current ||
          computation.stack!.indexOf(Autorun.current!) > -1
        ) {
          throw new Error('Circular dependencies are not allowed.');
        }
        computation.autorun!.rerun();
      }
    }
  }
}
