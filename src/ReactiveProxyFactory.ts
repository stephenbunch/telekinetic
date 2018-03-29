import Shape from './Shape';
import ShapeClass from './ShapeClass';

interface ProxyClass<T> {
  new(source?: T): T;
}

const VALUES = Symbol('telekinetic.proxy.values');
const __VALUES = Symbol('telekinetic.proxy.__values');

const INITIALIZED = Symbol('telekinetic.proxy.initialized');
const __INITIALIZED = Symbol('telekinetic.proxy.__initialized');

const NESTED_PROXY_CLASSES = Symbol('telekinetic.proxy.nested_proxy_classes');
const __NESTED_PROXY_CLASSES = Symbol('telekinetic.proxy.__nested_proxy_classes');

const IS_PROXY = Symbol('telekinetic.proxy.is_proxy');

function getValue(obj: { [index: string]: any }, key: string): any {
  const value = obj[key];
  if (typeof value === 'function') {
    return value.bind(obj);
  }
  return value;
}

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object';
}

function isPlainObject(obj: any): boolean {
  if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') {
    return false;
  }
  const proto = Object.getPrototypeOf(obj);
  if (!proto) {
    return true;
  }
  return proto.constructor === Object;
}

function getProxyClass<T extends Shape>(shapeClass: ShapeClass<T>): ProxyClass<T> {
  const keys = Object.keys(new shapeClass());
  class Proxy extends (shapeClass as ShapeClass<Shape>) {
    [__INITIALIZED]: boolean;
    [__VALUES]: Map<string, any>;
    [__NESTED_PROXY_CLASSES]: Map<any, any>;
    [IS_PROXY] = true;

    constructor(source?: T) {
      super();
      if (source) {
        for (const key of keys) {
          (this as { [index: string]: any })[key] = getValue(source, key);
        }
      }
      this[INITIALIZED] = true;
    }

    get [INITIALIZED](): boolean {
      if (this[__INITIALIZED] === undefined) {
        this[__INITIALIZED] = false;
      }
      return this[__INITIALIZED];
    }

    set [INITIALIZED](value: boolean) {
      this[__INITIALIZED] = value;
    }

    get [VALUES](): Map<string, any> {
      if (this[__VALUES] === undefined) {
        this[__VALUES] = new Map();
      }
      return this[__VALUES];
    }
  }
  for (const key of keys) {
    Object.defineProperty(Proxy.prototype, key, {
      get(this: Proxy) {
        return this[VALUES].get(key);
      },
      set(this: Proxy, value) {
        if (value !== this[VALUES].get(key)) {
          this[VALUES].set(key, value);
          if (this[INITIALIZED]) {

          }
        }
      }
    });
  }
  return Proxy as any as ProxyClass<T>;
}

class ReactiveProxyFactory<T extends Shape> {
  private proxyClass: ProxyClass<T>;

  constructor(shapeClass: ShapeClass<T>) {
    this.proxyClass = getProxyClass(shapeClass);
  }

  create(initialValue?: T): T {
    if (initialValue && initialValue instanceof this.proxyClass) {
      return initialValue;
    }
    return new this.proxyClass(initialValue);
  }
}

export default ReactiveProxyFactory;

// class Foo {
//   bar = 'hello';
// }

// const factory = new ReactiveProxyFactory(Foo);
// const foo = factory.create();
// console.log(foo.bar);
// foo.bar = 'world';
// console.log(foo.bar);
