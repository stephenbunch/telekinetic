import { observe, observeAsync } from './observe';
import { Dependency, CircularDependencyError } from './Dependency';
import { mockPromise, MockPromise, sleep, AsyncObserver } from './testing';

it('should run again when a dependency changes', () => {
  const dep = new Dependency('dep');
  let count = 0;
  const sub = observe('main', () => {
    dep.depend();
    count += 1;
  }).subscribe();
  dep.changed();
  dep.changed();
  expect(count).toBe(3);
  sub.unsubscribe();
});

it('should disconnect from previous dependencies on each new run', () => {
  const dep1 = new Dependency('dep1');
  const dep2 = new Dependency('dep2');
  let count = 0;
  const sub = observe('main', () => {
    if (count === 0) {
      dep1.depend();
    } else {
      dep2.depend();
    }
    count += 1;
  }).subscribe();
  dep1.changed();
  expect(count).toBe(2);
  dep1.changed();
  expect(count).toBe(2);
  dep2.changed();
  expect(count).toBe(3);
  sub.unsubscribe();
});

it('should support nested computations', () => {
  const dep1 = new Dependency('dep1');
  const dep2 = new Dependency('dep2');
  const dep3 = new Dependency('dep3');
  let countA = 0;
  let countB = 0;
  let countC = 0;
  const sub = observe('main', (comp) => {
    dep1.depend();
    comp.fork('main.sub', (comp) => {
      dep2.depend();
      comp.fork('main.sub.sub', () => {
        dep3.depend();
        countC += 1;
      });
      countB += 1;
    });
    countA += 1;
  }).subscribe();
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
  sub.unsubscribe();
});

it('should not rerun when disposed', () => {
  const dep = new Dependency('dep');
  let count = 0;
  const sub = observe('main', () => {
    dep.depend();
    count += 1;
  }).subscribe();
  dep.changed();
  sub.unsubscribe();
  dep.changed();
  expect(count).toBe(2);
});

it('should support async computations', async () => {
  const dep1 = new Dependency('dep1');
  const dep2 = new Dependency('dep2');
  let countA = 0;
  let countB = 0;
  let promiseA = mockPromise<number>();
  let promiseB = mockPromise<number>();
  const sub = observe('main', async (comp) => {
    dep1.depend();
    await new Promise(resolve => setImmediate(resolve));
    await comp.fork('sub', async () => {
      dep2.depend();
      await new Promise(resolve => setImmediate(resolve));
      countB += 1;
      promiseB.resolve(countB);
      promiseB = mockPromise<number>();
    });
    countA += 1;
    promiseA.resolve(countA);
    promiseA = mockPromise<number>();
  }).subscribe();
  expect(await Promise.all([promiseA, promiseB])).toEqual([1, 1]);
  dep2.changed();
  expect(await promiseB).toBe(2);
  dep1.changed();
  expect(await Promise.all([promiseA, promiseB])).toEqual([2, 3]);
  sub.unsubscribe();
});

it('should throw an error if a circular dependency is detected', () => {
  const dep = new Dependency('dep');
  let count = 0;
  expect(() => {
    observe('main', () => {
      count += 1;
      dep.depend();
      dep.changed();
    }).subscribe();
  }).toThrow(CircularDependencyError);
  expect(count).toBe(1);
});

it('should throw an error when a circular dependency is detected between ' +
  'autoruns', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    const dep3 = new Dependency('dep3');

    let count1 = 0;
    let count2 = 0;
    let count3 = 0;

    const sub1 = observe('main', () => {
      count1 += 1;
      dep1.depend();
      dep2.changed();
    }).subscribe();

    const sub2 = observe('main', () => {
      count2 += 1;
      dep2.depend();
      dep3.changed();
    }).subscribe();

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

    sub1.unsubscribe();
    sub2.unsubscribe();
    sub3.unsubscribe();
  });

it('should throw an error when a circular dependency is detected between ' +
  'async autoruns', async () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');

    const obs1 = new AsyncObserver<number>();
    const obs2 = new AsyncObserver<number>();

    let count1 = 0;
    let count2 = 0;

    // 1. run auto1
    // 2. run auto2 -> dep1 changed -> run auto1 -> dep2 changed -> run auto2
    //        -> dep1 changed -> error!

    const sub1 = observeAsync('auto1', async (comp) => {
      dep1.depend();
      await sleep();
      comp.continue(() => {
        dep2.changed();
      });
      return ++count1;
    }).subscribe(obs1);
    expect(await obs1.promise).toBe(1);

    const sub2 = observeAsync('auto2', async (comp) => {
      dep2.depend();
      await sleep();
      comp.continue(() => {
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
    const dep = new Dependency('dep');
    let count = 0;
    const def = mockPromise();
    const onError = jest.fn();
    const sub = observeAsync('main', async (comp) => {
      try {
        count += 1;
        dep.depend();
        await Promise.resolve();
        comp.continue(() => {
          dep.changed();
        });
      } finally {
        def.resolve();
      }
    }).subscribe(undefined, onError);

    await def;
    expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));
    expect(count).toBe(1);
    sub.unsubscribe();
  });

it('should throw an error when a circular dependency is detected between two ' +
  'forks', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let count1 = 0;
    let count2 = 0;
    const onError = jest.fn();
    const sub = observe('main', (comp) => {
      comp.fork('sub1', () => {
        count1 += 1;
        dep1.depend();
        dep2.changed();
      });

      comp.fork('sub2', () => {
        count2 += 1;
        dep2.depend();
        dep1.changed();
      });
    }).subscribe(undefined, onError);
    expect(onError).toHaveBeenCalledWith(expect.any(CircularDependencyError));
    expect(count1).toBe(2);
    expect(count2).toBe(2);
  });

it('should not throw a circular dependency error between two sibling graphs',
  () => {
    // This is a regression test.

    // 1. depend on nodes
    // 2. depend on result
    // 3. change nodes -> change result
    // 4. change nodes -> change result -> no error

    const nodes = new Dependency('nodes');
    const result = new Dependency('results');
    let count1 = 0;
    let count2 = 0;
    const sub = observe('main', (comp) => {
      comp.fork('sub1', () => {
        count1 += 1;
        nodes.depend();
        result.changed();
      });
      comp.fork('sub2', () => {
        count2 += 1;
        result.depend();
      });
    }).subscribe();
    expect(count1).toBe(1);
    expect(count2).toBe(1);

    nodes.changed();
    expect(count1).toBe(2);
    expect(count2).toBe(2);

    nodes.changed();
    expect(count1).toBe(3);
    expect(count2).toBe(3);

    sub.unsubscribe();
  });
