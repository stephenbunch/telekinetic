import { observe } from '../observe';
import { observable } from '../observable';

describe('@observable', () => {
  it('should setup dependency tracking on class members', () => {
    class Test {
      @observable
      foo = 2;
    }
    const obj = new Test();
    let result = 0;
    const sub = observe('main', () => {
      result = obj.foo;
    }).subscribe();
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });

  it('should setup dependency tracking on static members', () => {
    class Test {
      @observable
      static bar = 2;
    }
    let result = 0;
    const sub = observe('main', () => {
      result = Test.bar;
    }).subscribe();
    Test.bar = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });
});
