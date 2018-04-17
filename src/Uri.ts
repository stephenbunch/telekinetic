export enum UriSegmentKind {
  Name = 1,
  Uid = 2,
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

export class UidSegment {
  readonly kind = UriSegmentKind.Uid
  readonly uid: number;

  constructor(uid: number) {
    this.uid = uid;
  }

  toString() {
    return this.uid.toString();
  }
}

export type UriSegment = NameSegment | UidSegment;

export class Uri {
  readonly segments: ReadonlyArray<UriSegment>;

  constructor(segments: UriSegment[]) {
    this.segments = Object.freeze(segments);
  }

  toString() {
    return this.segments.join('.');
  }

  static create(...segments: Array<string | number>): Uri {
    return new Uri(
      segments.map((value) =>
        typeof value === 'number' ? new UidSegment(value) :
          new NameSegment(value)));

  }
}
