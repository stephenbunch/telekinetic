import { autorun, Autorun } from './autorun';
import { Bound } from './internal/Bound';
import { Dependency } from './Dependency';
import { Input } from './Input';
import { Logger } from './Logger';
import { Name } from './Name';
import { transaction } from './transaction';

function dispose(value: any) {
  if (value && typeof value.dispose === 'function') {
    value.dispose();
  }
}

export class ComputedValue<T> implements Input<T> {
  readonly name: Name;

  private readonly producer: () => T;
  private readonly dependency: Dependency;

  private autorun: Autorun | undefined;
  private value: T | undefined;

  constructor(name: Name, producer: () => T) {
    this.name = name;
    this.producer = producer;
    this.dependency = new Dependency(name);
    this.dependency.onHot.addListener(this.onHot);
    this.dependency.onCold.addListener(this.onCold);
  }

  get() {
    this.dependency.depend();
    if (this.autorun) {
      return this.value!;
    }
    return this.producer();
  }

  @Bound()
  private onHot() {
    let firstRun = true;
    this.autorun = autorun(this.name, (context) => {
      const value = transaction(() => this.producer());
      Logger.current.trace(() => [
        `Tracked dependencies for ${this.name}:`,
        context.getTrackedDependencies().map((dep) => dep.name.toString()),
      ]);
      if (firstRun) {
        firstRun = false;
        this.value = value;
      } else if (value !== this.value) {
        dispose(this.value);
        this.value = value;
        this.dependency.changed();
      }
    });
  }

  @Bound()
  private onCold() {
    this.autorun!.dispose();
    this.autorun = undefined;
    this.value = undefined;
  }
}
