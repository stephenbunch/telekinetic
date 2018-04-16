import { action } from './action';
import { computed } from './computed';
import { ComputedMap } from './ComputedMap';
import { ObservableMap } from './ObservableMap';
import { ObservableSet } from './ObservableSet';
import { observer } from './observer';
import { OrderedSet } from './OrderedSet';
import { Store } from './Store';
import { StoreObserver } from './StoreObserver';
import * as React from 'react';

type ItemRenderer<TItem> = (item: TItem) => React.ReactNode;

export interface CollectionBrushProps<TKey, TItem, TSortKey = any> {
  data: Store<TKey, TItem>;
  render(item: TItem): React.ReactNode;
  sort?(item: TItem): TSortKey;
  descending?: boolean;
}

@observer
export class CollectionBrush<TKey, TItem, TSortKey = any>
  extends React.Component<CollectionBrushProps<TKey, TItem, TSortKey>> {

  @computed
  private get storeObserver(): StoreObserver<TKey, TItem> {
    return new StoreObserver(this.props.data, this);
  }

  /**
   * This set will keep track of new and deleted entries.
   */
  @computed
  private get keys(): ObservableSet<TKey> {
    return new ObservableSet(
      `${this.constructor.name}.keys`, this.storeObserver.store.keys());
  }

  /**
   * This map stores the sortKey of each entry.
   */
  @computed
  private get sortKeys(): ComputedMap<TKey, TItem, TSortKey> | null {
    if (this.props.sort) {
      return new ComputedMap<TKey, TItem, TSortKey>(
        `${this.constructor.name}.sortKeys`,
        this.getSortKeySelector(this.props.sort),
        Array.from(this.storeObserver.store)
      );
    }
    return null;
  }

  @computed
  private get renderedItems(): ComputedMap<TKey, TItem, React.ReactNode> {
    return new ComputedMap<TKey, TItem, React.ReactNode>(
      `${this.constructor.name}.renderedEntries`,
      this.getItemRenderer(this.props.render),
      Array.from(this.storeObserver.store)
    );
  }

  @computed
  private get sortedKeys(): OrderedSet<TKey> {
    const sortedKeys = new OrderedSet(this.keys);
    if (this.props.sort) {
      sortedKeys.sort((key: TKey) => this.sortKeys!.get(key)!);
      if (this.props.descending) {
        sortedKeys.reverse();
      }
    }
    return sortedKeys;
  }

  render() {
    const items = this.sortedKeys.toArray().map((key) =>
      this.renderedItems.get(key));
    return <React.Fragment>{items}</React.Fragment>;
  }

  @action
  onAdd([key, item]: [TKey, TItem]) {
    this.keys.add(key);
    this.sortKeys && this.sortKeys.set(key, item);
    this.renderedItems.set(key, item);
  }

  @action
  onDelete([key, item]: [TKey, TItem]) {
    this.keys.delete(key);
    this.sortKeys && this.sortKeys.delete(key);
    this.renderedItems.delete(key);
  }

  @action
  onUpdate([key, item]: [TKey, TItem]) {
    this.sortKeys && this.sortKeys.set(key, item);
    this.renderedItems.set(key, item);
  }

  private getSortKeySelector(selector: (item: TItem) => TSortKey) {
    return (key: TKey, item: TItem) => selector(item);
  }

  private getItemRenderer(render: ItemRenderer<TItem>):
    (key: TKey, value: TItem) => React.ReactNode {
    return (key: TKey, value: TItem) => {
      let node = render(value) as React.ReactElement<{ key: TKey }>;
      if (React.isValidElement(node)) {
        node = React.cloneElement(node, { key });
      }
      return node;
    };
  }
}
