import { Bound } from '../internal/Bound';

describe('Bound', () => {
  it('should bind methods to the self', () => {
    class Foo {
      @Bound()
      bar(): this {
        return this;
      }
    }
    const foo = new Foo();
    const bar = foo.bar;
    expect(bar()).toBe(foo);
  });
});
