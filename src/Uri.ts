export enum UriSegmentKind {
  Name = 1,
  Index = 2,
}

export class NameSegment {
  readonly kind = UriSegmentKind.Name;
  readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  toString() {
    return this.name;
  }
}

export class IndexSegment {
  readonly kind = UriSegmentKind.Index
  readonly index: number;

  constructor(index: number) {
    this.index = index;
  }

  toString() {
    return this.index.toString();
  }
}

export class InstanceSegment implements IndexSegment {
  readonly kind = UriSegmentKind.Index

  private readonly instance: Symbol;
  private readonly instances: Symbol[];

  constructor(instance: Symbol, instances: Symbol[]) {
    this.instance = instance;
    this.instances = instances;
  }

  get index(): number {
    return this.instances.indexOf(this.instance);
  }

  toString() {
    return this.index.toString();
  }
}

export type UriSegment = NameSegment | IndexSegment;

export class Uri {
  readonly segments: UriSegment[];

  constructor(segments: UriSegment[]) {
    this.segments = segments;
  }

  toString() {
    return this.segments.join('.');
  }

  static create(...segments: Array<string | number>): Uri {
    return new Uri(
      segments.map((value) =>
        typeof value === 'number' ? new IndexSegment(value) :
          new NameSegment(value)));

  }
}
