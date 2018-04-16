export type Name = string;
export type Uid = number;

export enum UriSegmentKind {
  Name = 1,
  Uid = 2,
}

export class NameSegment {
  readonly kind = UriSegmentKind.Name;
  readonly name: Name;

  constructor(name: Name) {
    this.name = name;
  }

  toString() {
    return this.name;
  }
}

export class UidSegment {
  readonly kind = UriSegmentKind.Uid
  readonly uid: Uid;

  constructor(uid: Uid) {
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
}
