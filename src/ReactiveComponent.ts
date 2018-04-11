import * as React from 'react';
import { exclude, Computation } from './Computation';
import { batchUpdate } from './batchUpdate';
import { observe } from './observe';
import { ComputationContext } from './ComputationContext';
import { ObservableProxy } from './ObservableProxy';
import { Subscription } from 'rxjs/Subscription';

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
  private [__autorun]: Subscription | null = null;
  private [__result]: React.ReactNode = null;
  private [__proxified] = false;
  private [__props]: P | undefined;
  private [__rendering] = false;

  abstract get name(): string;

  get props(): Readonly<P> {
    return this[__props]!;
  }

  set props(value: Readonly<P>) {
    if (this[__props] === undefined || !this[__proxified]) {
      this[__props] = value;
    } else {
      batchUpdate(() => Object.assign(this[__props], value));
    }
  }

  construct?(computation: ComputationContext): any;

  abstract compute(): React.ReactNode;

  componentWillUnmount() {
    if (this[__autorun]) {
      this[__autorun]!.unsubscribe();
      this[__autorun] = null;
    }
  }

  render() {
    this[__rendering] = true;
    if (!this[__proxified]) {
      this[__props] = proxify(`${this.name}.props`, this[__props]);
      this[__proxified] = true;
    }
    if (this[__autorun] === null) {
      const name = `${this.name}.render`;
      this[__autorun] = observe(name, (root) => {
        root.fork('construct', (ctx) => this.construct && this.construct(ctx));
        root.fork('compute', () => {
          let result = this.compute();
          if (result !== this[__result]) {
            this[__result] = result;
            if (!this[__rendering]) {
              exclude(() => this.forceUpdate());
            }
          }
        });
      }).subscribe();
    }
    this[__rendering] = false;
    return this[__result];
  }
}
