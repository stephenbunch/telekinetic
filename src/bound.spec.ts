import { bound } from './bound';

describe('@bound', () => {
  it('should bind methods to the self', () => {
    class Foo {
      @bound
      bar(): this {
        return this;
      }
    }
    const foo = new Foo();
    const bar = foo.bar;
    expect(bar()).toBe(foo);
  });
});