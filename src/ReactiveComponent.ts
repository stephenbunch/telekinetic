import * as React from 'react';
import { Autorun, IAutorun } from './Autorun';
import { Computation } from './Computation';
import { ObservableProxy } from './ObservableProxy';

function proxify<T>(name: string, props: T): T {
  const obj = {} as T;
  Object.assign(obj, props);
  return ObservableProxy.wrap(name, obj);
}

export const __autorun = Symbol('autorun');
export const __result = Symbol('result');
export const __props = Symbol('props');
export const __proxified = Symbol('proxified');
export const __rendering = Symbol('rendering');

export abstract class ReactiveComponent<P = {}> extends React.Component<P> {
  private [__autorun]: IAutorun | null = null;
  private [__result]: React.ReactNode = null;
  private [__proxified] = false;
  private [__props]: P | undefined;
  private [__rendering] = false;

  get props(): Readonly<P> {
    return this[__props]!;
  }

  set props(value: Readonly<P>) {
    if (this[__props] === undefined || !this[__proxified]) {
      this[__props] = value;
    } else {
      Autorun.once(() => Object.assign(this[__props], value));
    }
  }

  construct?(computation: Computation): any;

  abstract compute(): React.ReactNode;

  componentWillUnmount() {
    if (this[__autorun]) {
      this[__autorun]!.dispose();
      this[__autorun] = null;
    }
  }

  render() {
    this[__rendering] = true;
    if (!this[__proxified]) {
      this[__props] = proxify(`${this.constructor.name}.props`, this[__props]);
      this[__proxified] = true;
    }
    if (this[__autorun] === null) {
      const name = `${this.constructor.name}.render`;
      this[__autorun] = Autorun.start(name, (root) => {
        root.fork('construct', (comp) => this.construct && this.construct(comp));
        root.fork('compute', () => {
          let result = this.compute();
          if (result !== this[__result]) {
            this[__result] = result;
            if (!this[__rendering]) {
              Autorun.exclude(() => this.forceUpdate());
            }
          }
        });
      });
    }
    this[__rendering] = false;
    return this[__result];
  }
}
