import { Observable } from 'rxjs/Observable';
import { RunFunction, ComputationClass } from './Computation';
import { ComputationRef } from './ComputationRef';

function run<TRunResult>(name: string,
  runFunc: RunFunction<TRunResult>): ComputationClass<TRunResult> {
  const comp = new ComputationClass<TRunResult>(name, runFunc);
  comp.run();
  return comp;
}

export function observe<T>(name: string,
  runFunc: RunFunction<T>): Observable<T> {
  return new Observable<T>((observer) => {
    const comp = run(name, (comp) => {
      try {
        observer.next(runFunc(comp));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      comp.dispose();
    };
  });
}

export function observeAsync<T>(name: string,
  runFunc: RunFunction<Promise<T>>): Observable<T> {
  return new Observable<T>((observer) => {
    const comp = run(name, async (comp) => {
      try {
        observer.next(await runFunc(comp));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      comp.dispose();
    };
  });
}
