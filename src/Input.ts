import { Name } from './Name';

export interface Input<T> {
  readonly name: Name;
  get(): T;
}
