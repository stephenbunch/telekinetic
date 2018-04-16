import { Disposable } from './Disposable';
import { Store } from './Store';

export interface StoreObserverDelegate<TKey, TItem> {
  onAdd?([key, item]: [TKey, TItem]): void;
  onDelete?([key, item]: [TKey, TItem]): void;
  onUpdate?([key, item]: [TKey, TItem]): void;
}

export class StoreObserver<TKey, TItem> implements Disposable {
  private delegate: StoreObserverDelegate<TKey, TItem>;

  readonly store: Store<TKey, TItem>

  constructor(store: Store<TKey, TItem>,
    delegate: StoreObserverDelegate<TKey, TItem>) {
    this.store = store;
    this.delegate = delegate;

    if (this.delegate.onAdd) {
      store.onAdd.addListener(this.delegate.onAdd);
    }
    if (this.delegate.onDelete) {
      store.onDelete.addListener(this.delegate.onDelete);
    }
    if (this.delegate.onUpdate) {
      store.onUpdate.addListener(this.delegate.onUpdate);
    }
  }

  dispose() {
    if (this.delegate.onAdd) {
      this.store.onAdd.removeListener(this.delegate.onAdd);
    }
    if (this.delegate.onDelete) {
      this.store.onDelete.removeListener(this.delegate.onDelete);
    }
    if (this.delegate.onUpdate) {
      this.store.onUpdate.removeListener(this.delegate.onUpdate);
    }
  }
}
