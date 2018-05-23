import { Dependency } from './Dependency';
import { Uri } from './Uri';

export class _KeyedDependency {
  private dependencies = new Map<any, Dependency>();
  readonly uri: Uri;

  constructor(uri: Uri) {
    this.uri = uri;
  }

  depend(key: any) {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key,
        new Dependency(this.uri.extend(key.toString())));
    }
    this.dependencies.get(key)!.depend();
  }

  changed(key: any) {
    if (this.dependencies.has(key)) {
      this.dependencies.get(key)!.changed();
    }
  }
}
