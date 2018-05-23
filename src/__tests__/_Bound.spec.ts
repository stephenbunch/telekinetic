import { _Bound } from '../decorators/_Bound';

describe('_Bound', () => {
  it('should bind methods to the self', () => {
    class Foo {
      @_Bound()
      bar(): this {
        return this;
      }
    }
    const foo = new Foo();
    const bar = foo.bar;
    expect(bar()).toBe(foo);
  });
});
