import { Autorun } from './Autorun';
import { ObservableProxy } from './ObservableProxy';

describe('ObservableObject', () => {
  it('should setup dependencies', () => {
    const obj = ObservableProxy.wrap('obj', { foo: 1 });
    let result = 0;
    const autorun = Autorun.start('main', () => {
      result = obj.foo;
    });
    expect(result).toBe(1);
    obj.foo = 3;
    expect(result).toBe(3);
    autorun.dispose();
  });

  it('should work with unknown properties', () => {
    const obj: { [index: string]: any } = ObservableProxy.wrap('obj', {});
    let result = 0;
    const autorun = Autorun.start('main', () => {
      result = obj.foo;
    });
    expect(result).toBe(undefined);
    obj.foo = 3;
    expect(result).toBe(3);
    autorun.dispose();
  });
});
