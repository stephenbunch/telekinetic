import { Observer, NextObserver, ErrorObserver } from 'rxjs/Observer';
import { Bound } from '../../internal/Bound';
import { Deferred } from './Deferred';

export class AsyncObserver<T = void>
  implements NextObserver<T>, ErrorObserver<T> {
  private def = new Deferred<T>();

  get promise(): Promise<T> {
    return this.def.promise;
  }

  @Bound
  next(value: T) {
    this.def.resolve(value);
    this.def = new Deferred<T>();
  }

  @Bound
  error(error: Error) {
    this.def.reject(error);
    this.def = new Deferred<T>();
  }
}
