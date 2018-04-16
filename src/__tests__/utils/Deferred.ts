export class Deferred<T = undefined> {
  private _resolve: ((result?: T) => void) | undefined;
  private _reject: ((error?: Error) => void) | undefined;
  readonly promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get resolve() {
    return this._resolve!;
  }

  get reject() {
    return this._reject!;
  }
}
