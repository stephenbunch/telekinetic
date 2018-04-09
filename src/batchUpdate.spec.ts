import { batchUpdate, batchUpdateAsync } from './batchUpdate';
import { Dependency } from './Dependency';
import { observe } from './observe';

describe('batchUpdate', () => {
  it('should suspend reruns', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    const sub = observe('main', () => {
      dep1.depend();
      dep2.depend();
      called += 1;
    }).subscribe();
    expect(called).toBe(1);

    batchUpdate(() => {
      batchUpdate(() => {
        dep1.changed();
        dep2.changed();
        expect(called).toBe(1);
      });
      expect(called).toBe(1);
    });

    expect(called).toBe(2);

    sub.unsubscribe();
  });

  it('should forward the return value', () => {
    expect(batchUpdate(() => 2)).toBe(2);
  });
});

describe('batchUpdateAsync', () => {
  it('should suspend reruns', async () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    const sub = observe('main', () => {
      dep1.depend();
      dep2.depend();
      called += 1;
    }).subscribe();
    expect(called).toBe(1);

    await batchUpdateAsync(async () => {
      await batchUpdateAsync(async () => {
        dep1.changed();
        await Promise.resolve();
        dep2.changed();
        expect(called).toBe(1);
      });
      expect(called).toBe(1);
    });

    expect(called).toBe(2);

    sub.unsubscribe();
  });

  it('should forward the return value', async () => {
    expect(await batchUpdateAsync(() => Promise.resolve(2))).toBe(2);
  });

  it('should resume on error', async () => {
    const dep = new Dependency('dep');
    let called = 0;
    const sub = observe('main', () => {
      dep.depend();
      called += 1;
    }).subscribe();
    expect(called).toBe(1);

    const error = new Error('test');
    try {
      await batchUpdateAsync(async () => {
        dep.changed();
        dep.changed();
        await Promise.reject(error);
        dep.changed();
      });
    } catch (err) {
      expect(err).toBe(error);
    }
    expect(called).toBe(2);

    dep.changed();
    expect(called).toBe(3);

    sub.unsubscribe();
  });
});
