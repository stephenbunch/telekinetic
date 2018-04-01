import { Dependency } from './Dependency';

export class KeyedDependency {
  private dependencies = new Map<any, Dependency>();

  depend(key: any) {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Dependency());
    }
    this.dependencies.get(key)!.depend();
  }

  changed(key: any) {
    if (this.dependencies.has(key)) {
      this.dependencies.get(key)!.changed();
    }
  }
}
