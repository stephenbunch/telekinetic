import { getClassName } from './decorators/Name';
import { getCurrentComputation } from './Computation';
import { ComputationContextClass } from './ComputationContext';
import { enqueue } from './transaction';
import { _Bound } from './decorators/_Bound';

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

const urisByInstance = new WeakMap<object, InstanceUri>();
const hotInstancesByClass = new WeakMap<Function, Array<any>>();

export class InstanceSegment implements NameSegment {
  readonly kind = UriSegmentKind.Name

  private readonly instance: object;
  private readonly className: string;

  private isHot = false;
  private contexts = new Set<ComputationContextClass>();

  constructor(instance: object) {
    this.instance = instance;
    this.className = getClassName(instance.constructor);
  }

  get name(): string {
    if (!this.isHot) {
      throw new Error(
        'Uri must be alive to get the name of an instance segment.');
    }
    const instances = hotInstancesByClass.get(this.instance.constructor)!;
    const index = instances.indexOf(this.instance);
    return `#${this.className}_${index.toString()}`;
  }

  activate() {
    const computation = getCurrentComputation();
    if (computation) {
      const context = computation.context!;
      if (!this.contexts.has(context)) {
        this.contexts.add(context);
        context.onDestroy.addListener(this.onContextDestroy);
      }
      if (!this.isHot) {
        this.isHot = true;
        if (!hotInstancesByClass.has(this.instance.constructor)) {
          hotInstancesByClass.set(this.instance.constructor, []);
        }
        const instances = hotInstancesByClass.get(this.instance.constructor)!;
        instances.push(this.instance);
      }
    }
  }

  toString() {
    return this.name;
  }

  @_Bound()
  private onContextDestroy(context: ComputationContextClass) {
    context.onDestroy.removeListener(this.onContextDestroy);
    this.contexts.delete(context);
    enqueue(() => {
      if (this.contexts.size === 0) {
        if (this.isHot) {
          this.isHot = false;
          const instances = hotInstancesByClass.get(this.instance.constructor)!;
          const index = instances.indexOf(this.instance);
          if (index > -1) {
            instances.splice(index, 1);
          }
        }
      }
    });
  }
}

export type UriSegment = NameSegment | IndexSegment;

export class Uri {
  readonly segments: ReadonlyArray<UriSegment>;

  constructor(segments: UriSegment[]) {
    this.segments = Object.freeze(segments);
  }

  toString() {
    return this.segments.join('.');
  }

  extend(...segments: Array<string | number>): Uri {
    const ctor = <typeof Uri>this.constructor;
    return new ctor(this.segments.concat(Uri.create(...segments).segments));
  }

  activate?(): void;

  static create(...segments: Array<string | number>): Uri {
    return new Uri(
      segments.map((value) =>
        typeof value === 'number' ? new IndexSegment(value) :
          new NameSegment(value)));

  }

  static fromClass(constructor: Function): Uri {
    return Uri.create(getClassName(constructor));
  }

  static instance(instance: object): InstanceUri {
    if (!urisByInstance.has(instance)) {
      urisByInstance.set(instance,
        new InstanceUri([new InstanceSegment(instance)]));
    }
    return urisByInstance.get(instance)!;
  }
}

export class InstanceUri extends Uri {
  activate() {
    (this.segments[0] as InstanceSegment).activate();
  }
}
