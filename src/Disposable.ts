export class DisposedError extends Error { }

export interface Disposable {
  dispose(): void;
}
