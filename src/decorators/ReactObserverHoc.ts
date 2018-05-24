import { Autorun, autorun } from '../autorun';
import { Name } from './Name';
import { ObservableProxy } from '../ObservableProxy';
import { transaction } from '../transaction';
import { untracked } from '../Computation';
import { Uri } from '../Uri';

class ObserverState {
  props: any;
  proxified = false;
  autorun: Autorun | undefined;
  result: any;
  rendering = false;
}

const stateSymbol = Symbol('state');

const states = new WeakMap<any, ObserverState>();

function getState(obj: any): ObserverState {
  if (!states.has(obj)) {
    states.set(obj, new ObserverState());
  }
  return states.get(obj)!;
}

interface ReactComponent {
  componentWillUnmount?(): void;
  render?(): any;
  forceUpdate(): void;
}

interface ReactComponentClass {
  new(): ReactComponent;
}

const instanceIdsByClass = new WeakMap<Function, Array<Symbol>>();

export const ReactObserverHoc = (name?: string): ClassDecorator =>
  <T extends Function>(constructor: T): T => {
    class type extends (constructor as any as ReactComponentClass) {
      private readonly uri = Uri.fromClass(this.constructor);

      get props() {
        return getState(this).props;
      }

      set props(value) {
        const state = getState(this);
        if (!state.autorun || state.props === undefined) {
          state.props = value;
        } else {
          transaction(() => Object.assign(state.props, value));
        }
      }

      componentWillUnmount() {
        if (super.componentWillUnmount) {
          super.componentWillUnmount();
        }
        const state = getState(this);
        if (state.autorun) {
          state.autorun.dispose();
        }
      }

      render() {
        if (!super.render) {
          return null;
        }
        const state = getState(this);
        state.rendering = true;
        if (!state.autorun) {
          state.props = ObservableProxy.wrap(
            this.uri.extend('props'), { ...state.props });
          state.autorun = autorun(this.uri.extend('render').toString(), () => {
            const result = super.render!();
            if (result !== state.result) {
              state.result = result;
              if (!state.rendering) {
                untracked(() => this.forceUpdate());
              }
            }
          });
        }
        state.rendering = false;
        return state.result;
      }
    }
    Object.defineProperty(type, 'name', {
      value: constructor.name,
      configurable: true,
      enumerable: false,
      writable: false,
    });
    Name(name || constructor.name)(type);
    return type as any as T;
  };
