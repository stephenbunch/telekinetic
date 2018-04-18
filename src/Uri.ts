import { nameSymbol } from './decorators/Name';

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

  private readonly instanceId: Symbol;
  private readonly instanceIds: Symbol[];

  constructor(instanceId: Symbol, instanceIds: Symbol[]) {
    this.instanceId = instanceId;
    this.instanceIds = instanceIds;
  }

  get index(): number {
    return this.instanceIds.indexOf(this.instanceId);
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

  extend(...segments: Array<string | number>): Uri {
    return new Uri(this.segments.concat(Uri.create(...segments).segments));
  }

  static create(...segments: Array<string | number>): Uri {
    return new Uri(
      segments.map((value) =>
        typeof value === 'number' ? new IndexSegment(value) :
          new NameSegment(value)));

  }

  static fromClass(constructor: Function): Uri {
    return Uri.create((constructor as any)[nameSymbol] || constructor.name);
  }

  static instance(instance: object): Uri {
    return Uri.fromClass(instance.constructor);
  }
}
