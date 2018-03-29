import Computation from './Computation';

interface IAutorun {
  readonly isAlive: boolean;
  readonly computation: Computation | null;
  exec<TResult>(callback: () => TResult): TResult;
  rerun(): void;
}

export default IAutorun;
