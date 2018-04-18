import { Disposable } from './Disposable';
import { RunFunction, ComputationClass } from './Computation';

export interface Autorun extends Disposable {
  readonly name: string;
  readonly isAlive: boolean;
}

export function autorun(name: string, runFunc: RunFunction<void>): Autorun {
  const comp = new ComputationClass(name, runFunc);
  comp.run();
  return comp;
}
