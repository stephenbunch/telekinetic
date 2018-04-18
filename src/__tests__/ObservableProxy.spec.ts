import { ObservableProxy } from '../ObservableProxy';
import { observe } from '../rxjs/observe';
import { Uri } from '../Uri';

describe('ObservableProxy', () => {
  it('should setup dependencies', () => {
    const obj = ObservableProxy.wrap(Uri.create('obj'), { foo: 1 });
    let result = 0;
    const sub = observe('main', () => {
      result = obj.foo;
    }).subscribe();
    expect(result).toBe(1);
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });

  it('should work with unknown properties', () => {
    const obj: { [index: string]: any } =
      ObservableProxy.wrap(Uri.create('obj'), {});
    let result = 0;
    const sub = observe('main', () => {
      result = obj.foo;
    }).subscribe();
    expect(result).toBe(undefined);
    obj.foo = 3;
    expect(result).toBe(3);
    sub.unsubscribe();
  });
});
