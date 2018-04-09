import { Dependency } from './Dependency';
import { exclude } from './Computation';
import { observe } from './observe';

describe('exclude', () => {
  it('should run the callback outside of any autorun', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    const sub = observe('main', () => {
      dep1.depend();
      exclude(() => {
        dep2.depend();
      });
      called += 1;
    }).subscribe();
    expect(called).toBe(1);

    dep1.changed();
    expect(called).toBe(2);

    dep2.changed();
    expect(called).toBe(2);

    sub.unsubscribe();
  });

  it('should forward the return value', () => {
    let result: number | undefined;
    const sub = observe('main', () => {
      result = exclude(() => 2);
    }).subscribe();
    expect(result).toBe(2);
    sub.unsubscribe();
  });
});
