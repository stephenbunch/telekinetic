import { autorun } from '../autorun';
import { Observable } from 'rxjs/Observable';
import { RunFunction } from '../Computation';

export function observe<T>(name: string,
  runFunc: RunFunction<T>): Observable<T> {
  return new Observable<T>((observer) => {
    const auto = autorun(name, (ctx) => {
      try {
        observer.next(runFunc(ctx));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      auto.dispose();
    };
  });
}

export function observeAsync<T>(name: string,
  runFunc: RunFunction<Promise<T>>): Observable<T> {
  return new Observable<T>((observer) => {
    const auto = autorun(name, async (ctx) => {
      try {
        observer.next(await runFunc(ctx));
      } catch (err) {
        observer.error(err);
      }
    });
    return () => {
      auto.dispose();
    };
  });
}
