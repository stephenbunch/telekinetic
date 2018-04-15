import { batch } from './batch';
import { bound } from './bound';
import { CollectionBrushStore } from './CollectionBrushStore';
import { ComputationContext } from './ComputationContext';
import { computed } from './computed';
import { Disposable } from './Disposable';
import { Event, EventController } from './Event';
import { untracked } from './Computation';
import { observable } from './observable';
import { ObservableMap } from './ObservableMap';
import { ObservableSet } from './ObservableSet';
import { OrderedSet } from './OrderedSet';
import { ReactiveComponent } from './ReactiveComponent';
import * as React from 'react';
import { ComputedMap } from './ComputedMap';

interface CollectionBrushControllerDelegate<K, V> {
  onAdd([key, value]: [K, V]): void;
  onDelete([key, value]: [K, V]): void;
  onUpdate([key, value]: [K, V]): void;
}

class CollectionBrushController<K, V, S> implements Disposable {
  private delegate: CollectionBrushControllerDelegate<K, V>;

  readonly store: CollectionBrushStore<K, V>

  readonly keys: ObservableSet<K>;

  constructor(name: string, store: CollectionBrushStore<K, V>,
    delegate: CollectionBrushControllerDelegate<K, V>) {
    this.store = store;
    this.delegate = delegate;

    store.onAdd.addListener(delegate.onAdd);
    store.onDelete.addListener(delegate.onDelete);
    store.onUpdate.addListener(delegate.onUpdate);

    // This set will keep track of new and deleted entries.
    this.keys = new ObservableSet(
      `${name}.keys`, store.keys());
  }

  dispose() {
    this.store.onAdd.removeListener(this.delegate.onAdd);
    this.store.onDelete.removeListener(this.delegate.onDelete);
    this.store.onUpdate.removeListener(this.delegate.onUpdate);
  }
}

export interface CollectionBrushProps<K, V, S = any> {
  data: CollectionBrushStore<K, V>;
  render(value: V): React.ReactNode;
  sort?(value: V): S;
  descending?: boolean;
}

export class CollectionBrush<K, V, S = any> extends
  ReactiveComponent<CollectionBrushProps<K, V, S>> {

  @computed
  private get controller(): CollectionBrushController<K, V, S> {
    return new CollectionBrushController(
      this.constructor.name, this.props.data, this);
  }

  /**
   * This map stores the sortKey of each entry.
   */
  @computed
  private get sortKeys(): ComputedMap<K, V, S> | null {
    if (this.props.sort) {
      return new ComputedMap<K, V, S>(
        `${this.constructor.name}.sortKeys`,
        this.getSortKeySelector(this.props.sort),
        Array.from(this.controller.store)
      );
    }
    return null;
  }

  @computed
  private get renderedEntries(): ComputedMap<K, V, React.ReactNode> {
    return new ComputedMap<K, V, React.ReactNode>(
      `${this.constructor.name}.renderedEntries`,
      this.getEntryRenderer(this.props.render),
      Array.from(this.controller.store)
    );
  }

  @computed
  private get sortedKeys(): OrderedSet<K> {
    const sortedKeys = new OrderedSet(this.controller.keys);
    if (this.props.sort) {
      sortedKeys.sort((key: K) => this.sortKeys!.get(key)!);
      if (this.props.descending) {
        sortedKeys.reverse();
      }
    }
    return sortedKeys;
  }

  @computed
  get element(): React.ReactNode {
    const entries = this.sortedKeys.toArray().map((key) =>
      this.renderedEntries.get(key));
    return <React.Fragment>{entries}</React.Fragment>;
  }

  @bound
  onAdd([key, value]: [K, V]) {
    batch(() => {
      this.controller.keys.add(key);
      this.sortKeys && this.sortKeys.set(key, value);
      this.renderedEntries.set(key, value);
    });
  }

  @bound
  onDelete([key, value]: [K, V]) {
    batch(() => {
      this.controller.keys.delete(key);
      this.sortKeys && this.sortKeys.delete(key);
      this.renderedEntries.delete(key);
    });
  }

  @bound
  onUpdate([key, value]: [K, V]) {
    batch(() => {
      this.sortKeys && this.sortKeys.set(key, value);
      this.renderedEntries.set(key, value);
    });
  }

  private getSortKeySelector(selector: (value: V) => S) {
    return (key: K, value: V) => selector(value);
  }

  private getEntryRenderer(render: (value: V) => React.ReactNode):
    (key: K, value: V) => React.ReactNode {
    return (key: K, value: V) => {
      let node = render(value) as React.ReactElement<{ key: K }>;
      if (React.isValidElement(node)) {
        node = React.cloneElement(node, { key });
      }
      return node;
    };
  }
}
