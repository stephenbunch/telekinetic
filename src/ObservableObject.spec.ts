import Autorun from './Autorun';
import ObservableObject from './ObservableObject';

describe('ObservableObject', () => {
  it('should setup dependencies', () => {
    const obj = ObservableObject.fromJS({ foo: 1 });
    let result = 0;
    const autorun = Autorun.start(() => {
      result = obj.foo;
    });
    expect(result).toBe(1);
    obj.foo = 3;
    expect(result).toBe(3);
    autorun.dispose();
  });

  it('should pass through if the value is already a proxy', () => {
    class A {
      foo = 1;
    }
    class B {
      bar = new A();
      baz = new A();
    }
    const obj = ObservableObject.fromJS(new B());
    obj.bar.foo = 2;
    obj.baz = obj.bar;
    expect(obj.bar).toBe(obj.baz);
  });

  it('should only run once when setting a nested shape node', () => {
    class A {
      bar = 1;
      baz = 1;
    }
    class B {
      foo = new A();
    }
    const obj = ObservableObject.fromJS(new B());

    let called = 0;
    const autorun = Autorun.start(() => {
      obj.foo.bar;
      obj.foo.baz;
      called += 1;
    });
    expect(called).toBe(1);

    obj.foo = {
      bar: 3,
      baz: 4,
    };
    expect(called).toBe(2);

    autorun.dispose();
  });
});
