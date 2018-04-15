import { Dependency } from './Dependency';
import { DisposedError } from './Disposable';
import { observe, observeAsync } from './observe';
import { AsyncObserver } from './testing';

describe('fork', () => {
  it('should not run if the parent has been disposed', () => {
    const dep = new Dependency('dep');
    let count = 0;
    const sub = observe('main', (ctx) => {
      ctx.fork('sub', () => {
        dep.depend();
        count += 1;
      });
    }).subscribe();
    sub.unsubscribe();
    dep.changed();
    expect(count).toBe(1);
  });

  it('should forward the return value', () => {
    let result: number | undefined;
    const sub = observe('main', (ctx) => {
      result = ctx.fork('sub', () => 2);
    }).subscribe();
    expect(result).toBe(2);
    sub.unsubscribe();
  });
});

describe('continue', () => {
  it('should continue inside the computation', async () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    let obs = new AsyncObserver();

    const sub = observeAsync('main', async (ctx) => {
      dep1.depend();
      await Promise.resolve();
      ctx.continue(() => {
        dep2.depend();
        called += 1;
      });
    }).subscribe(obs);

    await obs.promise;
    expect(called).toBe(1);

    dep1.changed();
    await obs.promise;
    expect(called).toBe(2);

    dep2.changed();
    await obs.promise;
    expect(called).toBe(3);

    sub.unsubscribe();
  });

  it('should not run if the computation has been rerun', async () => {
    const dep = new Dependency('dep');
    let called = 0;
    let nextCalled = 0;
    let obs = new AsyncObserver();

    const sub = observeAsync('main', async (ctx) => {
      dep.depend();
      called += 1;
      await Promise.resolve();
      if (ctx.isAlive) {
        ctx.continue(() => {
          nextCalled += 1;
        });
      }
    }).subscribe(obs);
    expect(called).toBe(1);
    expect(nextCalled).toBe(0);

    await obs.promise;
    expect(nextCalled).toBe(1);

    dep.changed();
    dep.changed();
    expect(called).toBe(3);
    expect(nextCalled).toBe(1);

    await obs.promise;
    expect(nextCalled).toBe(2);
  });

  it('should forward the return value', () => {
    let result: number | undefined;
    const sub = observe('main', (ctx) => {
      result = ctx.continue(() => 2);
    }).subscribe();
    sub.unsubscribe();
    expect(result).toBe(2);
  });
});
