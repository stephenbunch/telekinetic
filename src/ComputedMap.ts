import { batch } from './batch';
import { Dependency } from './Dependency';
import { ComputedValue } from './ComputedValue';
import { ObservableMap } from './ObservableMap';
import { untracked } from './Computation';

export class ComputedMap<TKey, TInput, TOutput> {
  readonly name: string;

  private inputs: ObservableMap<TKey, TInput>;
  private outputs: Map<TKey, ComputedValue<TOutput | undefined>>;
  private transform: (key: TKey, input: TInput) => TOutput;

  constructor(name: string, transform: (key: TKey, input: TInput) => TOutput,
    initialInputs?: ReadonlyArray<[TKey, TInput]>) {
    this.name = name;
    this.inputs = new ObservableMap(`${this.name}.inputs`, initialInputs);
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
    this.outputs.set(key, new ComputedValue(`${this.name}.outputs.${key}`, () => {
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
    batch(() => {
      this.inputs.set(key, input);
      if (!this.outputs.has(key)) {
        this.createOutputForKey(key);
      }
    });
    return this;
  }

  delete(key: TKey): boolean {
    return batch(() => {
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
      batch(() => {
        this.inputs.clear();
        this.outputs.clear();
      });
    }
  }
}
