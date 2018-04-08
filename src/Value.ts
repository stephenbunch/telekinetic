import { Dependency } from './Dependency';
import { Input } from './Input';

export class Value<T> implements Input<T> {
  readonly name: string;
  private value: T;
  private dependency: Dependency;

  constructor(name: string, initialValue: T) {
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
      this.value = value;
      this.dependency.changed();
    }
  }
}
