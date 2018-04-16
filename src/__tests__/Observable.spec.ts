import { Name } from '../Name';
import { Observable } from '../Observable';
import { observe } from '../observe';

describe('Observable', () => {
  it('should setup dependency tracking on class members', () => {
    class Test {
      @Observable()
      foo = 2;
    }
    const obj = new Test();
    let result = 0;
    const sub = observe(Name.of('main'), () => {
      result = obj.foo;
    }).subscribe();
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });

  it('should setup dependency tracking on static members', () => {
    class Test {
      @Observable()
      static bar = 2;
    }
    let result = 0;
    const sub = observe(Name.of('main'), () => {
      result = Test.bar;
    }).subscribe();
    Test.bar = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });
});
