import { exclude } from './Computation';
import { DisposedError } from './DisposedError';
import { observe, observeAsync } from './observe';
import { Dependency, CircularDependencyError } from './Dependency';

interface MockPromise<T> extends Promise<T> {
  resolve(result?: T): void;
  reject(error?: Error): void;
}

function mockPromise<T>(): MockPromise<T> {
  let resolve: ((result: T) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const mock = promise as MockPromise<T>;
  mock.resolve = resolve!;
  mock.reject = reject!;
  return mock;
}

const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('autorun', () => {
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

  describe('the fork function', () => {
    it('should not run if the parent has been disposed', () => {
      const dep = new Dependency('dep');
      let count = 0;
      const sub = observe('main', (comp) => {
        comp.fork('sub', () => {
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
      const sub = observe('main', (comp) => {
        result = comp.fork('sub', () => 2);
      }).subscribe();
      expect(result).toBe(2);
      sub.unsubscribe();
    });
  });

  describe('the continue function', () => {
    it('should continue inside the computation', async () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let called = 0;
      let def: MockPromise<void> | undefined;

      const sub = observeAsync('main', async (comp) => {
        def = mockPromise();
        dep1.depend();
        await Promise.resolve();
        comp.continue(() => {
          dep2.depend();
          called += 1;
        });
        def.resolve();
      }).subscribe();

      await def;
      expect(called).toBe(1);

      dep1.changed();
      await def;
      expect(called).toBe(2);

      dep2.changed();
      await def;
      expect(called).toBe(3);

      sub.unsubscribe();
    });

    it('should not run if the computation has been rerun', async () => {
      const dep = new Dependency('dep');
      let called = 0;
      let nextCalled = 0;
      let def;

      const sub = observeAsync('main', async (comp) => {
        def = mockPromise();
        dep.depend();
        called += 1;
        await Promise.resolve();
        if (comp.isAlive) {
          comp.continue(() => {
            nextCalled += 1;
          });
        }
        def.resolve();
      }).subscribe();
      expect(called).toBe(1);
      expect(nextCalled).toBe(0);

      await def;
      expect(nextCalled).toBe(1);

      dep.changed();
      dep.changed();
      expect(called).toBe(3);
      expect(nextCalled).toBe(1);

      await def;
      expect(nextCalled).toBe(2);
    });

    it('should forward the return value', () => {
      let result: number | undefined;
      const sub = observe('main', (comp) => {
        result = comp.continue(() => 2);
      }).subscribe();
      sub.unsubscribe();
      expect(result).toBe(2);
    });
  });

  describe('the exclude function', () => {
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

      let def1: MockPromise<void> | undefined;
      let def2: MockPromise<void> | undefined;

      let count1 = 0;
      let count2 = 0;

      // 1. run auto1
      // 2. run auto2 -> dep1 changed -> run auto1 -> dep2 changed -> run auto2
      //        -> dep1 changed -> error!

      const sub1 = observeAsync('main', async (comp) => {
        count1 += 1;
        def1 = mockPromise();
        try {
          dep1.depend();
          await sleep();
          comp.continue(() => {
            dep2.changed();
          });
        } finally {
          def1.resolve();
        }
      }).subscribe();
      expect(count1).toBe(1);
      await def1;

      const onError = mockPromise();

      const sub2 = observeAsync('main', async (comp) => {
        count2 += 1;
        def2 = mockPromise();
        try {
          dep2.depend();
          await sleep();
          comp.continue(() => {
            dep1.changed();
          });
        } finally {
          def2.resolve();
        }
      }).subscribe(undefined, (err) => onError.resolve(err));
      expect(count2).toBe(1);
      await def2;
      expect(count1).toBe(2);
      await def1;

      expect(count2).toBe(2);
      await def2;
      const err = await onError;
      expect(err).toBeInstanceOf(CircularDependencyError);

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
});
