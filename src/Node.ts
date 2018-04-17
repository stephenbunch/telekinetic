import { OrderedSet } from './internal/OrderedSet';
import { Uri, UriSegmentKind } from './Uri';

export class ConflictError extends Error { }
export class HandleClosedError extends Error { }

const typeConflict = 'This node already stores a different value type.';
const handleClosed = 'Handle is closed.';

export class Handle {
  private node: Node;
  private closed = false;

  constructor(node: Node) {
    this.node = node;
    this.node.handles.add(this);
  }

  write(value: any) {
    if (this.closed) {
      throw new HandleClosedError(handleClosed);
    }
    this.node.write(value);
  }

  close() {
    this.closed = true;
    this.node.handles.delete(this);
  }

  delete() {
    if (this.closed) {
      throw new HandleClosedError(handleClosed);
    }
    this.close();
    this.node.delete();
  }
}

export class Node {

  private readonly parent: Node | undefined;
  private value: NodeValue | undefined;
  handles = new Set<Handle>();

  constructor(parent?: Node) {
    this.parent = parent;
  }

  isEmpty(): boolean {
    return this.value === undefined || this.value.isEmpty();
  }

  delete() {
    this.value = undefined;
    if (this.handles.size === 0) {
      let parent = this.parent;
      if (parent) {
        if (parent.value && parent.value.removeChild) {
          parent.value.removeChild(this);
        }
        if (parent.isEmpty()) {
          parent.delete();
        }
      }
    }
  }

  write(value: any) {
    if (Array.isArray(value)) {
      if (this.value === undefined) {
        this.value = new ArrayValue(this);
      } else if (!(this.value instanceof ArrayValue)) {
        throw new ConflictError(typeConflict);
      }
    } else if (typeof value === 'object' && value !== null) {
      if (this.value === undefined) {
        this.value = new ObjectValue(this);
      } else if (!(this.value instanceof ObjectValue)) {
        throw new ConflictError(typeConflict);
      }
    } else {
      if (this.value === undefined) {
        this.value = new RawValue(this);
      } else if (!(this.value instanceof RawValue)) {
        throw new ConflictError(typeConflict);
      }
    }
    this.value!.write(value);
  }

  open(uri: Uri): Handle {
    let node = this as Node;
    for (let i = 0; i < uri.segments.length; i++) {
      const segment = uri.segments[i];
      if (segment.kind === UriSegmentKind.Name) {
        if (node.value === null || !(node.value instanceof ObjectValue)) {
          node.value = new ObjectValue(node);
        }
        node = node.value.addChild!(segment.name);
      } else if (segment.kind === UriSegmentKind.Uid) {
        if (node.value === null || !(node.value instanceof ArrayValue)) {
          node.value = new ArrayValue(node);
        }
        node = node.value.addChild!(segment.uid);
      }
    }
    return new Handle(node);
  }

  getSnapshot() {
    return this.value && this.value.getSnapshot();
  }
}

export interface NodeValue {
  readonly owner: Node;

  isEmpty(): boolean;
  getSnapshot(): any;
  write(value: any): void;

  removeChild?(node: Node): void;
  addChild?(key: any): Node;
}

export class RawValue implements NodeValue {
  readonly owner: Node;

  private data: any;

  constructor(owner: Node) {
    this.owner = owner;
  }

  isEmpty() {
    return this.data === undefined;
  }

  write(data: any) {
    this.data = data;
  }

  getSnapshot() {
    return this.data;
  }
}

export class ObjectValue implements NodeValue {
  readonly owner: Node;

  private readonly children = new OrderedSet<Node>();
  private readonly keys = new OrderedSet<string>();

  constructor(owner: Node) {
    this.owner = owner;
  }

  isEmpty() {
    return this.children.size === 0;
  }

  removeChild(node: Node) {
    if (this.children.has(node)) {
      const index = this.children.indexOf(node);
      this.children.delete(node);
      this.keys.delete(this.keys.get(index)!);
    }
  }

  addChild(key: string) {
    if (this.keys.has(key)) {
      const index = this.keys.indexOf(key);
      return this.children.get(index)!;
    } else {
      const node = new Node(this.owner);
      this.children.add(node);
      this.keys.add(key);
      return node;
    }
  }

  write(obj: any) {
    for (const key of Object.keys(obj)) {
      const node = this.addChild(key);
      node.write(obj[key]);
    }
  }

  getSnapshot() {
    const obj = {} as any;
    for (let i = 0; i < this.children.size; i++) {
      const key = this.keys.get(i)!;
      const node = this.children.get(i)!;
      obj[key] = node.getSnapshot();
    }
    return obj;
  }
}

export class ArrayValue implements NodeValue {
  readonly owner: Node;

  private readonly children = new OrderedSet<Node>();

  constructor(owner: Node) {
    this.owner = owner;
  }

  isEmpty() {
    return this.children.size > 0;
  }

  addChild(index: number): Node {
    if (index < this.children.size) {
      return this.children.get(index)!;
    } else {
      const node = new Node(this.owner);
      this.children.add(node);
      return node;
    }
  }

  removeChild(node: Node) {
    this.children.delete(node);
  }

  write(arr: any[]) {
    for (let i = 0; i < arr.length; i++) {
      let node = this.children.get(i);
      if (!node) {
        node = new Node(this.owner);
        this.children.add(node);
      }
      node.write(arr[i]);
    }
  }

  getSnapshot() {
    const arr = [];
    for (let i = 0; i < this.children.size; i++) {
      arr[i] = this.children.get(i)!.getSnapshot();
    }
    return arr;
  }
}
