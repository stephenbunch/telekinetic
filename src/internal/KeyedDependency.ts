import { Dependency } from '../Dependency';
import { Name } from '../Name';

export class KeyedDependency {
  private dependencies = new Map<any, Dependency>();
  readonly name: Name;

  constructor(name: Name) {
    this.name = name;
  }

  depend(key: any) {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Dependency(this.name.add(key.toString())));
    }
    this.dependencies.get(key)!.depend();
  }

  changed(key: any) {
    if (this.dependencies.has(key)) {
      this.dependencies.get(key)!.changed();
    }
  }
}
