import { OrderedSet } from './internal/OrderedSet';
import { Uri, UriSegmentKind } from './Uri';

export class Node {
  readonly key: any;
  private readonly parent: Node | undefined;

  private value: NodeValue | undefined;

  constructor(key?: any, parent?: Node) {
    this.key = key;
    this.parent = parent;
  }

  isEmpty(): boolean {
    return this.value === undefined || this.value.isEmpty();
  }

  delete() {
    let parent = this.parent;
    while (parent && parent.value && parent.value.removeChild) {
      parent.value.removeChild(this);
      if (parent.isEmpty()) {
        parent = parent.parent;
      } else {
        break;
      }
    }
  }

  write(value: any) {
    if (Array.isArray(value)) {
      if (this.value === undefined) {
        this.value = new ArrayValue();
      } else if (!(this.value instanceof ArrayValue)) {
        throw new Error('This node is already storing a different value type.');
      }
    } else if (typeof value === 'object' && value !== null) {
      if (this.value === undefined) {
        this.value = new ObjectValue();
      } else if (!(this.value instanceof ObjectValue)) {
        throw new Error('This node is already storing a different value type.');
      }
    } else {
      if (this.value === undefined) {
        this.value = new RawValue();
      } else if (!(this.value instanceof RawValue)) {
        throw new Error('This node is already storing a different value type.');
      }
    }
    this.value!.write(value);
  }

  create(uri: Uri): Node {
    let node = this as Node;
    for (let i = 0; i < uri.segments.length; i++) {
      const segment = uri.segments[i];
      if (segment.kind === UriSegmentKind.Name) {
        if (node.value === undefined || !(node.value instanceof ObjectValue)) {
          node.value = new ObjectValue(node);
        }
        node = node.value.addChild!(segment.name);
      } else if (segment.kind === UriSegmentKind.Uid) {
        if (node.value === undefined || !(node.value instanceof ArrayValue)) {
          node.value = new ArrayValue(node);
        }
        node = node.value.addChild!(segment.uid);
      }
    }
    return node;
  }

  getSnapshot() {
    return this.value && this.value.getSnapshot();
  }
}

export interface NodeValue {
  readonly owner: Node | undefined;

  isEmpty(): boolean;
  getSnapshot(): any;
  write(value: any): void;

  removeChild?(node: Node): void;
  addChild?(key: any): Node;
}

export class RawValue implements NodeValue {
  readonly owner: Node | undefined;

  private data: any;

  constructor(owner?: Node) {
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
  readonly owner: Node | undefined;

  private readonly children = new Map<string, Node>();

  constructor(owner?: Node) {
    this.owner = owner;
  }

  isEmpty() {
    return this.children.size === 0;
  }

  removeChild(node: Node) {
    this.children.delete(node.key);
  }

  addChild(key: string) {
    if (this.children.has(key)) {
      return this.children.get(key)!;
    } else {
      const node = new Node(key, this.owner);
      this.children.set(key, node);
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
    for (const [key, node] of this.children) {
      obj[key] = node.getSnapshot();
    }
    return obj;
  }
}

export class ArrayValue implements NodeValue {
  readonly owner: Node | undefined;

  private readonly children = new OrderedSet<Node>();
  private readonly uids = new OrderedSet<any>();

  constructor(owner?: Node) {
    this.owner = owner;
  }

  isEmpty() {
    return this.children.size > 0;
  }

  addChild(key: any): Node {
    if (this.uids.has(key)) {
      return this.children.get(this.uids.indexOf(key))!;
    } else {
      const node = new Node(key, this.owner);
      this.uids.add(key);
      return node;
    }
  }

  removeChild(node: Node) {
    if (this.children.has(node)) {
      const index = this.children.indexOf(node);
      this.children.delete(node);
      this.uids.delete(this.uids.get(index)!);
    }
  }

  write(arr: any[]) {
    for (let i = 0; i < arr.length; i++) {
      let node = this.children.get(i);
      if (!node) {
        node = new Node(Symbol(), this.owner);
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
