import Autorun from './Autorun';
import IAutorun from './IAutorun';

export default class Computation {
  autorun: IAutorun | null;
  isFirstRun: boolean;
  stack: IAutorun[] | null;

  constructor(autorun: IAutorun, isFirstRun: boolean, stack: IAutorun[]) {
    this.autorun = autorun;
    this.isFirstRun = isFirstRun;
    this.stack = stack;
  }

  get isAlive() {
    return this.autorun !== null;
  }

  continue(func) {
    if (this.autorun) {
      return this.autorun.exec(func);
    }
    return undefined;
  }

  fork(func) {
    if (this.autorun) {
      const autorun = new Autorun(func, this);
      try {
        return autorun.rerun();
      } catch (err) {
        autorun.dispose();
        throw err;
      }
    }
    return undefined;
  }

  dispose() {
    this.autorun = null;
    this.stack = null;
  }
}
