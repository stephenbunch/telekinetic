import {
  Action,
  Collection,
  CollectionObserver,
  Computed,
  ComputedMap,
  ObservableMap,
  ObservableSet,
  ReactObserverHoc,
  Uri,
} from '../../';
import * as React from 'react';

type ItemRenderer<TItem> = (item: TItem) => React.ReactNode;

export interface CollectionBrushProps<TKey, TItem, TSortKey = any> {
  data: Collection<TKey, TItem>;
  render(item: TItem): React.ReactNode;
  sort?(item: TItem): TSortKey;
  descending?: boolean;
}

@ReactObserverHoc()
export class CollectionBrush<TKey, TItem, TSortKey = any>
  extends React.Component<CollectionBrushProps<TKey, TItem, TSortKey>> {

  private readonly uri = Uri.create(this.constructor.name);

  @Computed()
  private get observer(): CollectionObserver<TKey, TItem> {
    return new CollectionObserver(this.props.data, this);
  }

  /**
   * This set will keep track of new and deleted entries.
   */
  @Computed()
  private get keys(): ObservableSet<TKey> {
    return new ObservableSet(
      this.uri.extend('keys'), this.observer.collection.keys());
  }

  /**
   * This map stores the sortKey of each entry.
   */
  @Computed()
  private get sortKeys(): ComputedMap<TKey, TItem, TSortKey> | null {
    if (this.props.sort) {
      return new ComputedMap<TKey, TItem, TSortKey>(
        this.uri.extend('sortKeys'),
        this.getSortKeySelector(this.props.sort),
        Array.from(this.observer.collection)
      );
    }
    return null;
  }

  @Computed()
  private get renderedItems(): ComputedMap<TKey, TItem, React.ReactNode> {
    return new ComputedMap<TKey, TItem, React.ReactNode>(
      this.uri.extend('renderedItems'),
      this.getItemRenderer(this.props.render),
      Array.from(this.observer.collection)
    );
  }

  @Computed()
  private get sortedKeys(): Array<TKey> {
    const sortedKeys = Array.from(this.keys);
    if (this.props.sort) {
      sortedKeys.sort((a, b) => {
        const keyA = this.sortKeys!.get(a)!;
        const keyB = this.sortKeys!.get(b)!;
        if (keyA > keyB) {
          return 1;
        } else if (keyA < keyB) {
          return -1;
        } else {
          return 0;
        }
      });
      if (this.props.descending) {
        sortedKeys.reverse();
      }
    }
    return sortedKeys;
  }

  render() {
    const items = this.sortedKeys.map((key) =>
      this.renderedItems.get(key));
    return <React.Fragment>{items}</React.Fragment>;
  }

  @Action()
  onAdd([key, item]: [TKey, TItem]) {
    this.keys.add(key);
    this.sortKeys && this.sortKeys.set(key, item);
    this.renderedItems.set(key, item);
  }

  @Action()
  onDelete([key, item]: [TKey, TItem]) {
    this.keys.delete(key);
    this.sortKeys && this.sortKeys.delete(key);
    this.renderedItems.delete(key);
  }

  @Action()
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
