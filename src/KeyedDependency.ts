import { Dependency } from './Dependency';

export class KeyedDependency {
  private dependencies = new Map<any, Dependency>();
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  depend(key: any) {
    if (!this.dependencies.has(key)) {
      this.dependencies.set(key, new Dependency(`${this.name}.${key}`));
    }
    this.dependencies.get(key)!.depend();
  }

  changed(key: any) {
    if (this.dependencies.has(key)) {
      this.dependencies.get(key)!.changed();
    }
  }
}
