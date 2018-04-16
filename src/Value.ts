import { Bound } from './internal/Bound';
import { Dependency } from './Dependency';
import { Input } from './Input';
import { Name } from './Name';
import { Store } from './Store';

export class Value<T> implements Input<T> {
  readonly name: Name;

  private readonly dependency: Dependency;
  private value: T;
  private store: Store | undefined;

  static store: Store | undefined;

  constructor(name: Name, initialValue: T) {
    this.name = name;
    this.value = initialValue;
    this.dependency = new Dependency(name);
    this.dependency.onHot.addListener(this.onHot);
    this.dependency.onCold.addListener(this.onCold);
  }

  get() {
    this.dependency.depend();
    return this.value;
  }

  set(value: T) {
    if (this.value !== value) {
      const prevValue = this.value;
      this.value = value;
      this.dependency.changed();
    }
  }

  @Bound()
  private onHot() {
    this.store = Value.store;
  }

  @Bound()
  private onCold() {
    this.store = undefined;
  }
}
