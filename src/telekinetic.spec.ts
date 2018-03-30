import Autorun from './Autorun';
import telekinetic from './telekinetic';

describe('telekinetic', () => {
  it('should setup dependency tracking on class members', () => {
    class Test {
      @telekinetic
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
      @telekinetic
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

  it('should convert objects to reactive proxies', () => {
    class B {
      @telekinetic
      foo = {bar: 2};
    }
    const obj = new B();
    let result = 0;
    const autorun = Autorun.start(() => {
      result = obj.foo.bar;
    });
    obj.foo.bar = 3;
    expect(result).toBe(3);
    obj.foo = {bar: 5};
    expect(result).toBe(5);
    autorun.dispose();
  });
});
