import { Observer, NextObserver, ErrorObserver } from 'rxjs/Observer';
import { bound } from '../internal/bound';

export interface MockPromise<T> extends Promise<T> {
  resolve(result?: T): void;
  reject(error?: Error): void;
}

export function mockPromise<T>(): MockPromise<T> {
  let resolve: ((result: T) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const mock = promise as MockPromise<T>;
  mock.resolve = resolve!;
  mock.reject = reject!;
  return mock;
}

export class AsyncObserver<T = void> implements NextObserver<T>, ErrorObserver<T> {
  private def = mockPromise<T>();

  get promise(): Promise<T> {
    return this.def;
  }

  @bound
  next(value: T) {
    this.def.resolve(value);
    this.def = mockPromise<T>();
  }

  @bound
  error(error: Error) {
    this.def.reject(error);
    this.def = mockPromise<T>();
  }
}

export const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));
