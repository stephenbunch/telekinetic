import * as React from 'react';
import { Autorun, IAutorun } from './Autorun';
import { Computation } from './Computation';
import { ObservableProxy } from './ObservableProxy';

function proxify<T>(props: T): T {
  const obj = {} as T;
  Object.assign(obj, props);
  return ObservableProxy.wrap(obj);
}

export abstract class ReactiveComponent<P = {}> extends React.Component<P> {
  private autorun: IAutorun | null = null;
  private result: React.ReactNode = null;
  private proxified = false;
  private _props: P | undefined;
  private rendering = false;

  get props(): Readonly<P> {
    return this._props!;
  }

  set props(value: Readonly<P>) {
    if (this._props === undefined || !this.proxified) {
      this._props = value;
    } else {
      Autorun.once(() => Object.assign(this._props, value));
    }
  }

  abstract construct(computation: Computation): any;

  abstract compute(): React.ReactNode;

  componentWillUnmount() {
    if (this.autorun) {
      this.autorun.dispose();
      this.autorun = null;
    }
  }

  render() {
    this.rendering = true;
    if (!this.proxified) {
      this._props = proxify(this._props);
      this.proxified = true;
    }
    if (this.autorun === null) {
      this.autorun = Autorun.start((root) => {
        root.fork((comp) => this.construct(comp));
        root.fork(() => {
          let result = this.compute();
          if (result !== this.result) {
            this.result = result;
            if (!this.rendering) {
              Autorun.exclude(() => this.forceUpdate());
            }
          }
        });
      });
    }
    this.rendering = false;
    return this.result;
  }
}
