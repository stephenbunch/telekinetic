import { Autorun, autorun } from '../autorun';
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

export const Observer = (name?: string): ClassDecorator => <T extends Function>(
  constructor: T): T => {
  const uri = Uri.create(name || constructor.name);
  class type extends (constructor as any as ReactComponentClass) {
    get props() {
      return getState(this).props;
    }

    set props(value) {
      const state = getState(this);
      if (!state.proxified || state.props === undefined) {
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
      if (!state.proxified) {
        state.props = ObservableProxy.wrap(
          uri.extend('props'), { ...state.props });
        state.proxified = true;
      }
      if (!state.autorun) {
        state.autorun = autorun(uri.extend('render').toString(), () => {
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
    value: name,
    configurable: true,
    enumerable: false,
    writable: false,
  });
  return type as any as T;
};
