import { Dependency } from './Dependency';
import { Input } from './Input';
import { autorun, Autorun } from './autorun';
import { transaction } from './transaction';
import { bound } from './bound';

function dispose(value: any) {
  if (value && typeof value.dispose === 'function') {
    value.dispose();
  }
}

export class ComputedValue<T> implements Input<T> {
  readonly name: string;

  private readonly producer: () => T;
  private readonly dependency: Dependency;

  private autorun: Autorun | undefined;
  private value: T | undefined;

  constructor(name: string, producer: () => T) {
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

  @bound
  private onHot() {
    let firstRun = true;
    this.autorun = autorun(this.name, (context) => {
      const value = transaction(() => this.producer());
      // console.log(this.name, context.getTrackedDependencies().map(x => x.name));
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

  @bound
  private onCold() {
    this.autorun!.dispose();
    this.autorun = undefined;
    this.value = undefined;
  }
}
