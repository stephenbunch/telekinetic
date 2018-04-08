export interface Input<T> {
  readonly name: string;
  get(): T;
}
