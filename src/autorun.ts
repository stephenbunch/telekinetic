import { Disposable } from './Disposable';
import { Name } from './Name';
import { RunFunction, ComputationClass } from './Computation';

export interface Autorun extends Disposable {
  readonly name: Name;
  readonly isAlive: boolean;
}

export function autorun(name: Name, runFunc: RunFunction<void>): Autorun {
  const comp = new ComputationClass(name, runFunc);
  comp.run();
  return comp;
}
