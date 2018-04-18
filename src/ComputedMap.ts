import { ComputedValue } from './ComputedValue';
import { Dependency } from './Dependency';
import { ObservableMap } from './ObservableMap';
import { transaction } from './transaction';
import { untracked } from './Computation';
import { Uri } from './Uri';

export class ComputedMap<TKey, TInput, TOutput> {
  readonly uri: Uri;

  private inputs: ObservableMap<TKey, TInput>;
  private outputs: Map<TKey, ComputedValue<TOutput | undefined>>;
  private transform: (key: TKey, input: TInput) => TOutput;

  constructor(uri: Uri, transform: (key: TKey, input: TInput) => TOutput,
    initialInputs?: ReadonlyArray<[TKey, TInput]>) {
    this.uri = uri;
    this.inputs = new ObservableMap(this.uri.extend('inputs'), initialInputs);
    this.transform = transform;
    this.outputs = new Map();

    const keys = untracked(() => Array.from(this.inputs.keys()));
    for (const key of keys) {
      this.createOutputForKey(key);
    }
  }

  get size(): number {
    return this.inputs.size;
  }

  get [Symbol.toStringTag](): 'Map' {
    return this.inputs[Symbol.toStringTag];
  }

  private createOutputForKey(key: TKey) {
    const uri = this.uri.extend('outputs', key.toString());
    this.outputs.set(key, new ComputedValue(uri, () => {
      const hasKey = untracked(() => this.inputs.has(key));
      if (hasKey) {
        return this.transform(key, this.inputs.get(key)!);
      }
      return undefined;
    }));
  }

  has(key: TKey): boolean {
    return this.inputs.has(key);
  }

  get(key: TKey): TOutput | undefined {
    const computed = this.outputs.get(key);
    return computed && computed.get();
  }

  set(key: TKey, input: TInput): this {
    const isNew = !this.inputs.has(key);
    transaction(() => {
      this.inputs.set(key, input);
      if (!this.outputs.has(key)) {
        this.createOutputForKey(key);
      }
    });
    return this;
  }

  delete(key: TKey): boolean {
    return transaction(() => {
      const result = this.inputs.delete(key);
      if (result) {
        this.outputs.delete(key);
      }
      return result;
    });
  }

  keys(): IterableIterator<TKey> {
    return this.inputs.keys();
  }

  *values(): IterableIterator<TOutput> {
    for (const key of this.keys()) {
      yield this.get(key)!;
    }
  }

  *entries(): IterableIterator<[TKey, TOutput]> {
    for (const key of this.keys()) {
      yield [key, this.get(key)!];
    }
  }

  [Symbol.iterator](): IterableIterator<[TKey, TOutput]> {
    return this.entries();
  }

  forEach(callbackfn: (value: TOutput, key: TKey, map: this) => void, thisArg?: any) {
    for (const key of this.keys()) {
      callbackfn(this.get(key)!, key, this);
    }
  }

  clear() {
    if (this.inputs.size > 0) {
      transaction(() => {
        this.inputs.clear();
        this.outputs.clear();
      });
    }
  }
}
