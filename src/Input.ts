import { Dependency } from './Dependency';

interface Input<T> {
  get(): T;
}

class InputController<T> {
  private value: T;
  private dependency: Dependency;

  constructor(name: string, initialValue: T) {
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
