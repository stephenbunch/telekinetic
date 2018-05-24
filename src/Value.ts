import { _Bound } from './decorators/_Bound';
import { autorun, Autorun } from './autorun';
import { Dependency } from './Dependency';
import { Input } from './Input';
import { State } from './State';
import { untracked } from './Computation';
import { Uri } from './Uri';

export class Value<T> implements Input<T> {
  private readonly dependency: Dependency;
  private value: T;
  private state: State | undefined;
  private autoSyncFromState: Autorun | undefined;

  static globalState: State | undefined;

  constructor(uri: Uri, initialValue: T, persist: boolean) {
    this.value = initialValue;
    this.dependency = new Dependency(uri);
    if (persist) {
      this.dependency.onHot.addListener(this.onHot);
      this.dependency.onCold.addListener(this.onCold);
    }
  }

  get uri() {
    return this.dependency.uri;
  }

  get() {
    this.dependency.depend();
    return this.value;
  }

  set(value: T) {
    if (this.state) {
      this.state.set(value);
    } else if (this.value !== value) {
      this.value = value;
      this.dependency.changed();
    }
  }

  @_Bound()
  private onHot() {
    if (Value.globalState) {
      untracked(() => {
        this.state = Value.globalState!.findOrCreate(this.uri);
        if (this.state.hasValue()) {
          this.value = this.state.get();
        } else {
          this.state.set(this.value);
        }
      });
      let firstRun = true;
      this.autoSyncFromState = autorun(this.uri.toString(), () => {
        if (this.state!.hasValue()) {
          this.value = this.state!.get();
          if (!firstRun) {
            this.dependency.changed();
          }
        }
        firstRun = false;
      });
    }
  }

  @_Bound()
  private onCold() {
    if (this.state) {
      this.state = undefined;
      this.autoSyncFromState!.dispose();
    }
  }
}
