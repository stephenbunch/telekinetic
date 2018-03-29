import Computation from './Computation';

interface IAutorun {
  readonly isAlive: boolean;
  readonly computation: Computation | null;
  exec(func: (computation: Computation) => any): void;
  rerun(): void;
}

export default IAutorun;
