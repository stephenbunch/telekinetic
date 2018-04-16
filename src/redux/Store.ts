export interface Action {
  type: string;
}

export type Listener = () => void;
export type Unsubscriber = () => void;

export interface Store {
  dispatch(action: Action): Action;
  subscribe(listener: Listener): Unsubscriber;
  getState(): any;
}
