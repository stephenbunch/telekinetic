import { AsyncObserver } from './testing/AsyncObserver';
import { autorun } from '../autorun';
import { Deferred } from './testing/Deferred';
import { Dependency, CircularDependencyError } from '../Dependency';
import { observe, observeAsync } from '../rxjs/observe';
import { sleep } from './testing/sleep';
import { Uri } from '../Uri';

it('should run again when a dependency changes', () => {
  const dep = new Dependency(Uri.create('dep'));
  let count = 0;
  const auto = autorun('main', () => {
    dep.depend();
    count += 1;
  });
  dep.changed();
  dep.changed();
  expect(count).toBe(3);
  auto.dispose();
});

it('should disconnect from previous dependencies on each new run', () => {
  const dep1 = new Dependency(Uri.create('dep1'));
  const dep2 = new Dependency(Uri.create('dep2'));
  let count = 0;
  const auto = autorun('main', () => {
    if (count === 0) {
      dep1.depend();
    } else {
      dep2.depend();
    }
    count += 1;
  });
  dep1.changed();
  expect(count).toBe(2);
  dep1.changed();
  expect(count).toBe(2);
  dep2.changed();
  expect(count).toBe(3);
  auto.dispose();
});

it('should support nested computations', () => {
  const dep1 = new Dependency(Uri.create('dep1'));
  const dep2 = new Dependency(Uri.create('dep2'));
  const dep3 = new Dependency(Uri.create('dep3'));
  let countA = 0;
  let countB = 0;
  let countC = 0;
  const auto = autorun('main', (ctx) => {
    dep1.depend();
    ctx.fork('sub', (ctx) => {
      dep2.depend();
      ctx.fork('sub', () => {
        dep3.depend();
        countC += 1;
      });
      countB += 1;
    });
    countA += 1;
  });
  dep1.changed();
  expect(countA).toBe(2);
  expect(countB).toBe(2);
  expect(countC).toBe(2);
  dep2.changed();
  expect(countA).toBe(2);
  expect(countB).toBe(3);
  expect(countC).toBe(3);
  dep3.changed();
  expect(countA).toBe(2);
  expect(countB).toBe(3);
  expect(countC).toBe(4);
  dep1.changed();
  expect(countA).toBe(3);
  expect(countB).toBe(4);
  expect(countC).toBe(5);
  auto.dispose();
});

it('should not rerun when disposed', () => {
  const dep = new Dependency(Uri.create('dep'));
  let count = 0;
  const auto = autorun('main', () => {
    dep.depend();
    count += 1;
  });
  dep.changed();
  auto.dispose();
  dep.changed();
  expect(count).toBe(2);
});

it('should support async computations', async () => {
  const dep1 = new Dependency(Uri.create('dep1'));
  const dep2 = new Dependency(Uri.create('dep2'));
  let countA = 0;
  let countB = 0;
  let defA = new Deferred<number>();
  let defB = new Deferred<number>();
  const auto = autorun('main', async (ctx) => {
    dep1.depend();
    await new Promise(resolve => setImmediate(resolve));
    await ctx.fork('sub', async () => {
      dep2.depend();
      await new Promise(resolve => setImmediate(resolve));
      countB += 1;
      defB.resolve(countB);
      defB = new Deferred<number>();
    });
    countA += 1;
    defA.resolve(countA);
    defA = new Deferred<number>();
  });
  expect(await Promise.all([defA.promise, defB.promise])).toEqual([1, 1]);
  dep2.changed();
  expect(await defB.promise).toBe(2);
  dep1.changed();
  expect(await Promise.all([defA.promise, defB.promise])).toEqual([2, 3]);
  auto.dispose();
});

it('should throw an error if a circular dependency is detected', () => {
  const dep = new Dependency(Uri.create('dep'));
  const onError = jest.fn();
  const sub = observe('main', () => {
    dep.depend();
    dep.changed();
  }).subscribe(undefined, onError);
  expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));
});

it('should throw an error when a circular dependency is detected between ' +
  'autoruns', () => {
    const dep1 = new Dependency(Uri.create('dep1'));
    const dep2 = new Dependency(Uri.create('dep2'));
    const dep3 = new Dependency(Uri.create('dep3'));

    let count1 = 0;
    let count2 = 0;
    let count3 = 0;

    const auto1 = autorun('main', () => {
      count1 += 1;
      dep1.depend();
      dep2.changed();
    });

    const auto2 = autorun('main', () => {
      count2 += 1;
      dep2.depend();
      dep3.changed();
    });

    const onError = jest.fn();
    const sub3 = observe('main', () => {
      count3 += 1;
      dep3.depend();
      dep1.changed();
    }).subscribe(undefined, onError);
    expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));

    expect(count1).toBe(2);
    expect(count2).toBe(2);
    expect(count3).toBe(2);

    auto1.dispose();
    auto2.dispose();
    sub3.unsubscribe();
  });

it('should throw an error when a circular dependency is detected between ' +
  'async autoruns', async () => {
    const dep1 = new Dependency(Uri.create('dep1'));
    const dep2 = new Dependency(Uri.create('dep2'));

    const obs1 = new AsyncObserver<number>();
    const obs2 = new AsyncObserver<number>();

    let count1 = 0;
    let count2 = 0;

    // 1. run auto1
    // 2. run auto2 -> dep1 changed -> run auto1 -> dep2 changed -> run auto2
    //        -> dep1 changed -> error!

    const sub1 = observeAsync('auto1', async (ctx) => {
      dep1.depend();
      await sleep();
      ctx.continue(() => {
        dep2.changed();
      });
      return ++count1;
    }).subscribe(obs1);
    expect(await obs1.promise).toBe(1);

    const sub2 = observeAsync('auto2', async (ctx) => {
      dep2.depend();
      await sleep();
      ctx.continue(() => {
        dep1.changed();
      });
      return ++count2;
    }).subscribe(obs2);

    expect(await obs2.promise).toBe(1);
    expect(await obs1.promise).toBe(2);

    let error: Error;
    try {
      await obs2.promise;
    } catch (err) {
      error = err;
    }
    expect(error!).toBeDefined();
    expect(error!).toBeInstanceOf(CircularDependencyError);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });

it('should throw an error when a circular dependency is detected between ' +
  'multiple segments of the same async autorun', async () => {
    const dep = new Dependency(Uri.create('dep'));
    let count = 0;
    const def = new Deferred();
    const onError = jest.fn();
    const sub = observeAsync('main', async (ctx) => {
      try {
        count += 1;
        dep.depend();
        await Promise.resolve();
        ctx.continue(() => {
          dep.changed();
        });
      } finally {
        def.resolve();
      }
    }).subscribe(undefined, onError);

    await def.promise;
    expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));
    expect(count).toBe(1);
    sub.unsubscribe();
  });

it('should throw an error when a circular dependency is detected between two ' +
  'forks', () => {
    const dep1 = new Dependency(Uri.create('dep1'));
    const dep2 = new Dependency(Uri.create('dep2'));
    let count1 = 0;
    let count2 = 0;
    const onError = jest.fn();
    const sub = observe('main', (ctx) => {
      ctx.fork('sub1', () => {
        count1 += 1;
        dep1.depend();
        dep2.changed();
      });

      ctx.fork('sub2', () => {
        count2 += 1;
        dep2.depend();
        dep1.changed();
      });
    }).subscribe(undefined, onError);
    expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));
    expect(count1).toBe(2);
    expect(count2).toBe(2);
    sub.unsubscribe();
  });

it('should not throw a circular dependency error between two sibling graphs',
  () => {
    // This is a regression test.

    // 1. depend on nodes
    // 2. depend on result
    // 3. change nodes -> change result
    // 4. change nodes -> change result -> no error

    const nodes = new Dependency(Uri.create('nodes'));
    const result = new Dependency(Uri.create('results'));
    let count1 = 0;
    let count2 = 0;
    const auto = autorun('main', (ctx) => {
      ctx.fork('sub1', () => {
        count1 += 1;
        nodes.depend();
        result.changed();
      });
      ctx.fork('sub2', () => {
        count2 += 1;
        result.depend();
      });
    });
    expect(count1).toBe(1);
    expect(count2).toBe(1);

    nodes.changed();
    expect(count1).toBe(2);
    expect(count2).toBe(2);

    nodes.changed();
    expect(count1).toBe(3);
    expect(count2).toBe(3);

    auto.dispose();
  });
