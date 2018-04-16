export type Namepath = Readonly<Array<string>>;

export class Name {
  readonly path: Namepath;

  static of(name: string) {
    return new Name([name]);
  }

  constructor(path: Namepath) {
    this.path = path;
  }

  toString() {
    return this.path.join('.');
  }

  join(other: Name) {
    return new Name(this.path.concat(other.path));
  }

  add(segment: string): Name {
    return new Name(this.path.concat([segment]));
  }
}
