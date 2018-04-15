import { transaction } from './transaction';
import { bound } from './bound';
import { CollectionBrushStore } from './CollectionBrushStore';
import { ComputationContext } from './ComputationContext';
import { computed, observer } from './computed';
import { Disposable } from './Disposable';
import { Event, EventController } from './Event';
import { untracked } from './Computation';
import { observable } from './observable';
import { ObservableMap } from './ObservableMap';
import { ObservableSet } from './ObservableSet';
import { OrderedSet } from './OrderedSet';
import { ReactiveComponent } from './ReactiveComponent';
import * as React from 'react';

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
  name: string;
  data: CollectionBrushStore<K, V>;
  render(value: V): React.ReactNode;
  sort?(value: V): S;
  descending?: boolean;
}

@observer
export class CollectionBrush<K, V, S = any> extends
  ReactiveComponent<CollectionBrushProps<K, V, S>> {

  @computed
  private get controller(): CollectionBrushController<K, V, S> {
    return new CollectionBrushController(
      this.props.name, this.props.data, this);
  }

  /**
   * This map stores the sortKey of each entry.
   */
  @computed
  private get sortKeys(): ObservableMap<K, S> | null {
    if (this.props.sort) {
      const sortKeys = new ObservableMap<K, S>(`${this.props.name}.sortKeys`);
      // We don't want to recreate the map every time a key is added or removed.
      for (const key of this.controller.store.keys()) {
        sortKeys.set(key, this.getSortKeyForEntry(key));
      }
      return sortKeys;
    }
    return null;
  }

  @computed
  private get renderedEntries(): ObservableMap<K, React.ReactNode> {
    const entries = new ObservableMap<K, React.ReactNode>(
      `${this.props.name}.renderedEntries`);
    // Make sure the prop is read even if there are no entries in the
    // store initially.
    this.props.render;
    for (const [key, value] of this.controller.store) {
      entries.set(key, this.renderEntry(key, value));
    }
    return entries;
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
    transaction(() => {
      this.controller.keys.add(key);
      this.sortKeys && this.sortKeys.set(key, this.getSortKeyForEntry(key));
      this.renderedEntries.set(key, this.renderEntry(key, value));
    });
  }

  @bound
  onDelete([key, value]: [K, V]) {
    transaction(() => {
      this.controller.keys.delete(key);
      this.sortKeys && this.sortKeys.delete(key);
      this.renderedEntries.delete(key);
    });
  }

  @bound
  onUpdate([key, value]: [K, V]) {
    transaction(() => {
      this.sortKeys && this.sortKeys.set(key, this.getSortKeyForEntry(key));
      this.renderedEntries.set(key, this.renderEntry(key, value));
    });
  }

  private getSortKeyForEntry(entryKey: K): S {
    return this.props.sort!(this.controller.store.get(entryKey)!);
  }

  private renderEntry(key: K, value: V): React.ReactNode {
    let node = this.props.render(value) as React.ReactElement<{ key: K }>;
    if (React.isValidElement(node)) {
      node = React.cloneElement(node, { key });
    }
    return node;
  }
}
