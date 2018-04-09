import { Observable } from 'rxjs/Observable';
import { RunFunction, ComputationClass } from './Computation';
import { ComputationRef } from './ComputationRef';

function start<TRunResult>(name: string,
  runFunc: RunFunction<TRunResult>): ComputationClass<TRunResult> {
  const autorun = new ComputationClass<TRunResult>(name, runFunc);
  autorun.rerun();
  return autorun;
}

export function observe<T>(name: string,
  runFunc: RunFunction<T>): Observable<T> {
  return new Observable<T>((observer) => {
    const autorun = start(name, (comp) => {
      try {
        observer.next(runFunc(comp));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      autorun.dispose();
    };
  });
}

export function observeAsync<T>(name: string,
  runFunc: RunFunction<Promise<T>>): Observable<T> {
  return new Observable<T>((observer) => {
    const autorun = start(name, async (comp) => {
      try {
        observer.next(await runFunc(comp));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      autorun.dispose();
    };
  });
}
