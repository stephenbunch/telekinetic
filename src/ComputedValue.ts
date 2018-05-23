import { autorun, Autorun } from './autorun';
import { _Bound } from './decorators/_Bound';
import { Dependency } from './Dependency';
import { Input } from './Input';
import { Logger } from './Logger';
import { transaction } from './transaction';
import { Uri } from './Uri';

function dispose(value: any) {
  if (value && typeof value.dispose === 'function') {
    value.dispose();
  }
}

export class ComputedValue<T> implements Input<T> {
  readonly uri: Uri;

  private readonly producer: () => T;
  private readonly dependency: Dependency;

  private autorun: Autorun | undefined;
  private value: T | undefined;

  constructor(uri: Uri, producer: () => T) {
    this.uri = uri;
    this.producer = producer;
    this.dependency = new Dependency(uri);
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

  @_Bound()
  private onHot() {
    let firstRun = true;
    this.autorun = autorun(this.uri.toString(), (context) => {
      const value = transaction(() => this.producer());
      Logger.current.trace(() => [
        `Tracked dependencies for ${this.uri}:`,
        context.getTrackedDependencies().map((dep) => dep.uri.toString()),
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

  @_Bound()
  private onCold() {
    this.autorun!.dispose();
    this.autorun = undefined;
    this.value = undefined;
  }
}
