import * as React from 'react';
import { untracked, ComputationClass } from './Computation';
import { transaction } from './transaction';
import { observe } from './observe';
import { ComputationContext } from './ComputationContext';
import { ObservableProxy } from './ObservableProxy';
import { Autorun, autorun } from './autorun';

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
  private [__autorun]: Autorun;
  private [__result]: React.ReactNode = null;
  private [__proxified] = false;
  private [__props]: P | undefined;
  private [__rendering] = false;

  abstract readonly element: React.ReactNode;

  get props(): Readonly<P> {
    return this[__props]!;
  }

  set props(value: Readonly<P>) {
    if (this[__props] === undefined || !this[__proxified]) {
      this[__props] = value;
    } else {
      transaction(() => Object.assign(this[__props], value));
    }
  }

  componentWillUnmount() {
    if (this[__autorun]) {
      this[__autorun].dispose();
    }
  }

  render() {
    this[__rendering] = true;
    if (!this[__proxified]) {
      this[__props] = proxify(`${this.constructor.name}.props`, this[__props]);
      this[__proxified] = true;
    }
    if (!this[__autorun]) {
      const name = `${this.constructor.name}.render`;
      this[__autorun] = autorun(name, () => {
        let result = this.element;
        if (result !== this[__result]) {
          this[__result] = result;
          if (!this[__rendering]) {
            untracked(() => this.forceUpdate());
          }
        }
      });
    }
    this[__rendering] = false;
    return this[__result];
  }
}
