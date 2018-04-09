import { exclude, batchUpdate } from './Computation';
import { bound } from './bound';
import { ComputationRef } from './ComputationRef';
import { Event, EventController } from './Event';
import { observable } from './observable';
import { ObservableMap } from './ObservableMap';
import { ObservableSet } from './ObservableSet';
import { OrderedSet } from './OrderedSet';
import { ReactiveComponent } from './ReactiveComponent';
import * as React from 'react';

export class CollectionBrushStore<K, V> implements Iterable<[K, V]> {
  private store = new Map<K, V>();
  private _onAdd = new EventController<[K, V]>();
  private _onDelete = new EventController<[K, V]>();
  private _onUpdate = new EventController<[K, V]>();

  get onAdd(): Event<[K, V]> {
    return this._onAdd.event;
  }

  get onDelete(): Event<[K, V]> {
    return this._onDelete.event;
  }

  get onUpdate(): Event<[K, V]> {
    return this._onUpdate.event;
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.store[Symbol.iterator]();
  }

  entries(): Iterable<[K, V]> {
    return this.store.entries();
  }

  keys(): Iterable<K> {
    return this.store.keys();
  }

  values(): Iterable<V> {
    return this.store.values();
  }

  get(key: K): V | undefined {
    return this.store.get(key);
  }

  set(key: K, value: V) {
    if (this.store.has(key)) {
      this.store.set(key, value);
      this._onUpdate.trigger([key, value]);
    } else {
      this.store.set(key, value);
      this._onAdd.trigger([key, value]);
    }
  }

  delete(key: K) {
    if (this.store.has(key)) {
      const value = this.store.get(key)!;
      this.store.delete(key);
      this._onDelete.trigger([key, value]);
    }
  }
}

export interface CollectionBrushProps<K, V, S = any> {
  name: string;
  data: CollectionBrushStore<K, V>;
  render(value: V): React.ReactNode;
  sort?(value: V): S;
  descending?: boolean;
}

export abstract class CollectionBrush<K, V, S = any> extends
  ReactiveComponent<CollectionBrushProps<K, V, S>> {
  private store: CollectionBrushStore<K, V> | null = null;

  @observable
  private result: React.ReactNode[] | undefined;

  @observable
  private keys: ObservableSet<K> | undefined;

  @observable
  private sortKeys: ObservableMap<K, S> | undefined;

  @observable
  private renderResults: ObservableMap<K, React.ReactNode> | undefined;

  construct(comp: ComputationRef) {
    // This will rereun anytime this.props.data changes.
    batchUpdate(() => {
      if (this.store) {
        this.store.onAdd.removeListener(this.onAdd);
        this.store.onDelete.removeListener(this.onDelete);
        this.store.onUpdate.removeListener(this.onUpdate);
      }
      this.store = this.props.data;
      this.store.onAdd.addListener(this.onAdd);
      this.store.onDelete.addListener(this.onDelete);
      this.store.onUpdate.addListener(this.onUpdate);

      // This map will store the render result of each entry.
      this.renderResults = new ObservableMap(
        `${this.props.name}.renderResults`);

      // This set will keep track of new and deleted entries.
      this.keys = new ObservableSet(
        `${this.props.name}.keys`, this.store.keys());

      // This map will store the sortKey of each entry.
      this.sortKeys = new ObservableMap(`${this.props.name}.sortKeys`);

      comp.fork('getSortKeys', () => {
        // This will rerun anytime this.props.sort changes.
        batchUpdate(() => {
          if (this.props.sort) {
            for (const key of this.store!.keys()) {
              this.addSortKeyForEntry(key);
            }
          }
        });
      });

      comp.fork('renderAllEntries', (comp) => {
        // This will rerun anytime this.props.render changes.
        batchUpdate(() => {
          // Make sure the prop is read even if there are no entries in the
          // store initially.
          this.props.render;
          for (const [key, value] of this.store!) {
            this.renderEntry(key, value);
          }
        });
      });

      comp.fork('sortEntriesUsingSortKeys', (comp) => {
        // This will rerun anytime the this.keys or this.sortKeys change.
        const sortedKeys = new OrderedSet(this.keys);
        if (this.props.sort) {
          sortedKeys.sort((key: K) => this.sortKeys!.get(key)!);
          if (this.props.descending) {
            sortedKeys.reverse();
          }
        }
        comp.fork('useSortedKeysToMakeFinalResult', () => {
          // This will rerun anytime a result in this.renderResults changes.
          this.result = sortedKeys.toArray().map((key) =>
            this.renderResults!.get(key));
        });
      });
    });
  }

  compute() {
    return <React.Fragment>{this.result}</React.Fragment>;
  }

  @bound
  onAdd([key, value]: [K, V]) {
    batchUpdate(() => {
      this.keys!.add(key);
      this.addSortKeyForEntry(key);
      this.renderEntry(key, value);
    });
  }

  @bound
  onDelete([key, value]: [K, V]) {
    batchUpdate(() => {
      this.keys!.delete(key);
      this.sortKeys!.delete(key);
      this.renderResults!.delete(key);
    });
  }

  @bound
  onUpdate([key, value]: [K, V]) {
    batchUpdate(() => {
      this.addSortKeyForEntry(key);
      this.renderEntry(key, value);
    });
  }

  addSortKeyForEntry(entryKey: K) {
    if (this.props.sort) {
      const sortKey = this.props.sort(this.store!.get(entryKey)!);
      this.sortKeys!.set(entryKey, sortKey);
    }
  }

  renderEntry(key: K, value: V) {
    let node = this.props.render(value) as React.ReactElement<{ key: K }>;
    if (React.isValidElement(node)) {
      node = React.cloneElement(node, { key });
    }
    const renderResults = exclude(() => this.renderResults!);
    renderResults.set(key, node);
  }
}
