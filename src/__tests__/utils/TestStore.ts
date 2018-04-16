import { Store, Action, Listener, Unsubscriber } from '../../Store';
import { EventController } from '../../Event';

export type Reducer = (state: {}, action: Action) => {};

export class TestStore implements Store {
  private reducer: Reducer
  private state: {};
  private onDispatch = new EventController();

  constructor(reducer: Reducer, initialState?: {}) {
    this.reducer = reducer;
    this.state = initialState || {};
  }

  getState() {
    return this.state;
  }

  dispatch(action: Action): Action {
    this.state = this.reducer(this.state, action);
    return action;
  }

  subscribe(listener: Listener): Unsubscriber {
    this.onDispatch.addListener(listener);
    return () => this.onDispatch.removeListener(listener);
  }
}
