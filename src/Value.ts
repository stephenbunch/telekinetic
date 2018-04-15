import { Dependency } from './Dependency';
import { Input } from './Input';

export type ValueChangeEventListener<T> = (prevValue: T, nextValue: T) => void;

export class Value<T> implements Input<T> {
  readonly name: string;
  private value: T;
  private dependency: Dependency;
  private onChange: ValueChangeEventListener<T> | undefined;

  constructor(name: string, initialValue: T,
    onChange?: ValueChangeEventListener<T>) {
    this.name = name;
    this.value = initialValue;
    this.dependency = new Dependency(name);
  }

  get input(): Input<T> {
    return this;
  }

  get() {
    this.dependency.depend();
    return this.value;
  }

  set(value: T) {
    if (this.value !== value) {
      const prevValue = this.value;
      this.value = value;
      if (this.onChange) {
        this.onChange(prevValue, value);
      }
      this.dependency.changed();
    }
  }
}
