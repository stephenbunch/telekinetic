import { Uri } from './Uri';

export interface Input<T> {
  readonly uri: Uri;
  get(): T;
}
