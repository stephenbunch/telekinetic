import { Name } from '../Name';
import { ObservableProxy } from '../ObservableProxy';
import { observe } from '../rxjs/observe';

describe('ObservableProxy', () => {
  it('should setup dependencies', () => {
    const obj = ObservableProxy.wrap(Name.of('obj'), { foo: 1 });
    let result = 0;
    const sub = observe(Name.of('main'), () => {
      result = obj.foo;
    }).subscribe();
    expect(result).toBe(1);
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });

  it('should work with unknown properties', () => {
    const obj: { [index: string]: any } =
      ObservableProxy.wrap(Name.of('obj'), {});
    let result = 0;
    const sub = observe(Name.of('main'), () => {
      result = obj.foo;
    }).subscribe();
    expect(result).toBe(undefined);
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });
});
