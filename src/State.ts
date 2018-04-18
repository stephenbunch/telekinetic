import { Computed } from './decorators/Computed';
import { Observable } from './decorators/Observable';
import { OrderedSet } from './internal/OrderedSet';
import { Uri, UriSegmentKind } from './Uri';
import { Action } from './decorators/Action';

export class State {
  private parent: State | undefined;

  @Observable()
  private value: StateValue | undefined;

  constructor(parent?: State) {
    this.parent = parent;
  }

  @Action()
  delete() {
    this.value = undefined;
    if (this.parent && this.parent.value && this.parent.value.removeChild) {
      this.parent.value.removeChild(this);
    }
    this.parent = undefined;
  }

  @Action()
  set(value: any) {
    if (Array.isArray(value)) {
      if (!(this.value instanceof StateArray)) {
        this.value = new StateArray(this);
      }
    } else if (typeof value === 'object' && value !== null) {
      if (!(this.value instanceof StateObject)) {
        this.value = new StateObject(this);
      }
    } else if (!(this.value instanceof StateLiteral)) {
      this.value = new StateLiteral(this);
    }
    this.value!.set(value);
  }

  @Action()
  findOrCreate(uri: Uri): State {
    let state = this as State;
    for (let i = 0; i < uri.segments.length; i++) {
      const segment = uri.segments[i];
      if (segment.kind === UriSegmentKind.Name) {
        if (!(state.value instanceof StateObject)) {
          state.value = new StateObject(state);
        }
        state = state.value.findOrCreateChild!(segment.name);
      } else if (segment.kind === UriSegmentKind.Index) {
        if (!(state.value instanceof StateArray)) {
          state.value = new StateArray(state);
        }
        state = state.value.findOrCreateChild!(segment.index);
      }
    }
    return state;
  }

  get() {
    return this.value && this.value.get();
  }
}

interface StateValue {
  readonly owner: State;

  get(): any;
  set(value: any): void;

  removeChild?(state: State): void;
  findOrCreateChild?(key: any): State;
}

class StateLiteral implements StateValue {
  readonly owner: State;

  @Observable()
  private value: any;

  constructor(owner: State) {
    this.owner = owner;
  }

  set(value: any) {
    this.value = value;
  }

  get() {
    return this.value;
  }
}

class StateObject implements StateValue {
  readonly owner: State;

  private readonly children = new OrderedSet<State>();
  private readonly keys = new OrderedSet<string>();

  constructor(owner: State) {
    this.owner = owner;
  }

  removeChild(state: State) {
    if (this.children.has(state)) {
      const index = this.children.indexOf(state);
      this.children.delete(state);
      this.keys.delete(this.keys.get(index)!);
    }
  }

  findOrCreateChild(key: string) {
    if (this.keys.has(key)) {
      const index = this.keys.indexOf(key);
      return this.children.get(index)!;
    } else {
      const state = new State(this.owner);
      this.children.add(state);
      this.keys.add(key);
      return state;
    }
  }

  set(obj: any) {
    for (const key of Object.keys(obj)) {
      const state = this.findOrCreateChild(key);
      state.set(obj[key]);
    }
  }

  @Computed()
  get() {
    const obj = {} as any;
    for (let i = 0; i < this.children.size; i++) {
      const key = this.keys.get(i)!;
      const state = this.children.get(i)!;
      obj[key] = state.get();
    }
    return obj;
  }
}

class StateArray implements StateValue {
  readonly owner: State;

  private readonly children = new OrderedSet<State>();

  constructor(owner: State) {
    this.owner = owner;
  }

  findOrCreateChild(index: number): State {
    if (index < this.children.size) {
      return this.children.get(index)!;
    } else {
      const state = new State(this.owner);
      this.children.add(state);
      return state;
    }
  }

  removeChild(state: State) {
    this.children.delete(state);
  }

  set(arr: any[]) {
    for (let i = 0; i < arr.length; i++) {
      let state = this.children.get(i);
      if (!state) {
        state = new State(this.owner);
        this.children.add(state);
      }
      state.set(arr[i]);
    }
  }

  @Computed()
  get() {
    const arr = [];
    for (let i = 0; i < this.children.size; i++) {
      arr[i] = this.children.get(i)!.get();
    }
    return arr;
  }
}
