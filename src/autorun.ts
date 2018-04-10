import { RunFunction, ComputationClass } from './Computation';

export interface Autorun {
  readonly name: string;
  readonly isAlive: boolean;
  destroy(): void;
}

export function autorun(name: string, runFunc: RunFunction<void>): Autorun {
  const comp = new ComputationClass(name, runFunc);
  comp.run();
  return comp;
}
