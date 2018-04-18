import { Dependency } from '../Dependency';
import { observe } from '../rxjs/observe';
import { untracked } from '../Computation';
import { Uri } from '../Uri';

describe('untracked', () => {
  it('should run the callback outside of any autorun', () => {
    const dep1 = new Dependency(Uri.create('dep1'));
    const dep2 = new Dependency(Uri.create('dep2'));
    let called = 0;
    const sub = observe('main', () => {
      dep1.depend();
      untracked(() => {
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
      result = untracked(() => 2);
    }).subscribe();
    expect(result).toBe(2);
    sub.unsubscribe();
  });
});
