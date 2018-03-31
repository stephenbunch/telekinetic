import Autorun from './Autorun';
import IAutorun from './IAutorun';
import OrderedSet from './OrderedSet';
import RunFunction from './RunFunction';

export default class Computation {
  autorun: IAutorun | null;
  isFirstRun: boolean;
  stack: OrderedSet<IAutorun> | null;

  constructor(autorun: IAutorun, isFirstRun: boolean, stack: OrderedSet<IAutorun>) {
    this.autorun = autorun;
    this.isFirstRun = isFirstRun;
    this.stack = stack;
  }

  get isAlive(): boolean {
    return this.autorun !== null;
  }

  continue<TResult>(callback: () => TResult): TResult | undefined {
    if (this.autorun) {
      return this.autorun.exec(callback);
    }
    return undefined;
  }

  fork<TRunResult>(runFunc: RunFunction<TRunResult>): TRunResult | undefined {
    if (this.autorun) {
      const autorun = new Autorun(runFunc, this);
      try {
        return autorun.rerun();
      } catch (err) {
        autorun.dispose();
        throw err;
      }
    }
    return undefined;
  }

  dispose(): void {
    this.autorun = null;
    this.stack = null;
  }
}
