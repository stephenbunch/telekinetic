import { Collection } from './Collection';
import { Disposable } from './Disposable';

export interface CollectionObserverDelegate<TKey, TItem> {
  onAdd?([key, item]: [TKey, TItem]): void;
  onDelete?([key, item]: [TKey, TItem]): void;
  onUpdate?([key, item]: [TKey, TItem]): void;
}

export class CollectionObserver<TKey, TItem> implements Disposable {
  private delegate: CollectionObserverDelegate<TKey, TItem>;

  readonly collection: Collection<TKey, TItem>

  constructor(collection: Collection<TKey, TItem>,
    delegate: CollectionObserverDelegate<TKey, TItem>) {
    this.collection = collection;
    this.delegate = delegate;

    if (this.delegate.onAdd) {
      collection.onAdd.addListener(this.delegate.onAdd);
    }
    if (this.delegate.onDelete) {
      collection.onDelete.addListener(this.delegate.onDelete);
    }
    if (this.delegate.onUpdate) {
      collection.onUpdate.addListener(this.delegate.onUpdate);
    }
  }

  dispose() {
    if (this.delegate.onAdd) {
      this.collection.onAdd.removeListener(this.delegate.onAdd);
    }
    if (this.delegate.onDelete) {
      this.collection.onDelete.removeListener(this.delegate.onDelete);
    }
    if (this.delegate.onUpdate) {
      this.collection.onUpdate.removeListener(this.delegate.onUpdate);
    }
  }
}
