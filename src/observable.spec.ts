import { observable } from './observable';
import Autorun from './Autorun';

describe('observable', () => {
  it('should setup dependency tracking on class members', () => {
    class Test {
      @observable
      foo = 2;
    }
    const obj = new Test();
    let result = 0;
    const autorun = Autorun.start(() => {
      result = obj.foo;
    });
    obj.foo = 3;
    expect(result).toBe(3);
    autorun.dispose();
  });

  it('should setup dependency tracking on static members', () => {
    class Test {
      @observable
      static bar = 2;
    }
    let result = 0;
    const autorun = Autorun.start(() => {
      result = Test.bar;
    });
    Test.bar = 3;
    expect(result).toBe(3);
    autorun.dispose();
  });

  it('should convert objects to observable objects', () => {
    class B {
      @observable
      foo = { bar: 2 };
    }
    const obj = new B();
    let result = 0;
    const autorun = Autorun.start(() => {
      result = obj.foo.bar;
    });
    obj.foo.bar = 3;
    expect(result).toBe(3);
    obj.foo = { bar: 5 };
    expect(result).toBe(5);
    autorun.dispose();
  });

  it('should not interfere with arrays', () => {
    class A {
      @observable
      foo = [1];
    }
    const obj = new A();
    let result: number[] = [];
    const autorun = Autorun.start(() => {
      result = obj.foo;
    });
    obj.foo = [2, 3];
    expect(result).toEqual([2, 3]);
    autorun.dispose();
  });

  it('should convert maps to observable maps', () => {
    class A {
      @observable
      foo = new Map<string, string>();
    }
    const obj = new A();
    let result: string | undefined;
    const autorun = Autorun.start(() => {
      result = obj.foo.get('foo');
    });
    obj.foo.set('foo', 'bar');
    expect(result).toBe('bar');
  });
});
