import { Autorun } from './Autorun';
import { Dependency, CircularDependencyError } from './Dependency';

interface MockPromise<T> extends Promise<T> {
  resolve(result: T): void;
  reject(error: Error): void;
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

describe('Autorun', () => {
  it('should run again when the dependency changes', () => {
    const dep = new Dependency('dep');
    let count = 0;
    const autorun = Autorun.start('main', () => {
      dep.depend();
      count += 1;
    });
    dep.changed();
    dep.changed();
    expect(count).toBe(3);
    autorun.dispose();
  });

  it('should disconnect from previous dependencies on each new run', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let count = 0;
    const autorun = Autorun.start('main', () => {
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
    autorun.dispose();
  });

  it('should support nested computations', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    const dep3 = new Dependency('dep3');
    let countA = 0;
    let countB = 0;
    let countC = 0;
    const autorun = Autorun.start('main', (comp) => {
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
    autorun.dispose();
  });

  it('should not run when disposed', () => {
    const dep = new Dependency('dep');
    let count = 0;
    const autorun = Autorun.start('main', () => {
      dep.depend();
      count += 1;
    });
    dep.changed();
    autorun.dispose();
    dep.changed();
    expect(count).toBe(2);
  });

  it('should work with async computations', async () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let countA = 0;
    let countB = 0;
    let promiseA = mockPromise<number>();
    let promiseB = mockPromise<number>();
    const autorun = Autorun.start('main', async (comp) => {
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
    });
    expect(await Promise.all([promiseA, promiseB])).toEqual([1, 1]);
    dep2.changed();
    expect(await promiseB).toBe(2);
    dep1.changed();
    expect(await Promise.all([promiseA, promiseB])).toEqual([2, 3]);
    autorun.dispose();
  });

  it('should throw an error if a circular dependency is detected', () => {
    const dep = new Dependency('dep');
    let count = 0;
    expect(() => {
      Autorun.start('main', () => {
        count += 1;
        dep.depend();
        dep.changed();
      });
    }).toThrow(CircularDependencyError);
    expect(count).toBe(1);
  });

  describe('the fork function', () => {
    it('should not run if the parent has been disposed', () => {
      const dep = new Dependency('dep');
      let count = 0;
      const autorun = Autorun.start('main', (comp) => {
        comp.fork('sub', () => {
          dep.depend();
          count += 1;
        });
      });
      autorun.dispose();
      dep.changed();
      expect(count).toBe(1);
    });

    it('should forward the return value', () => {
      let result: number | undefined;
      const autorun = Autorun.start('main', (comp) => {
        result = comp.fork('sub', () => 2);
      });
      expect(result).toBe(2);
      autorun.dispose();
    });

    it('should return undefined if the autorun has been disposed', async () => {
      let result: string | undefined = 'foo';
      const autorun = Autorun.start('main', async (comp) => {
        await Promise.resolve();
        result = comp.fork('sub', () => 'bar');
      });
      autorun.dispose();
      await autorun.value;
      expect(result).toBeUndefined();
    });
  });

  describe('the continue function', () => {
    it('should continue inside the computation', async () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let called = 0;

      const autorun = Autorun.start('main', async (comp) => {
        dep1.depend();
        await Promise.resolve();
        comp.continue(() => {
          dep2.depend();
          called += 1;
        });
      });

      expect(autorun.value instanceof Promise).toBe(true);

      await autorun.value;
      expect(called).toBe(1);

      dep1.changed();
      await autorun.value;
      expect(called).toBe(2);

      dep2.changed();
      await autorun.value;
      expect(called).toBe(3);

      autorun.dispose();
    });

    it('should not run if the computation has been rerun', async () => {
      const dep = new Dependency('dep');
      let called = 0;
      let nextCalled = 0;

      const autorun = Autorun.start('main', async (comp) => {
        dep.depend();
        called += 1;
        await Promise.resolve();
        comp.continue(() => {
          nextCalled += 1;
        });
      });
      expect(called).toBe(1);
      expect(nextCalled).toBe(0);

      await autorun.value;
      expect(nextCalled).toBe(1);

      dep.changed();
      dep.changed();
      expect(called).toBe(3);
      expect(nextCalled).toBe(1);

      await autorun.value;
      expect(nextCalled).toBe(2);
    });

    it('should forward the return value', () => {
      let result: number | undefined;
      const autorun = Autorun.start('main', (comp) => {
        result = comp.continue(() => 2);
      });
      autorun.dispose();
      expect(result).toBe(2);
    });
  });

  describe('the once function', () => {
    it('should suspend reruns', () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let called = 0;
      const autorun = Autorun.start('main', () => {
        dep1.depend();
        dep2.depend();
        called += 1;
      });
      expect(called).toBe(1);

      Autorun.once(() => {
        Autorun.once(() => {
          dep1.changed();
          dep2.changed();
          expect(called).toBe(1);
        });
        expect(called).toBe(1);
      });

      expect(called).toBe(2);

      autorun.dispose();
    });

    it('should forward the return value', () => {
      expect(Autorun.once(() => 2)).toBe(2);
    });
  });

  describe('the onceAsync function', () => {
    it('should suspend reruns', async () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let called = 0;
      const autorun = Autorun.start('main', () => {
        dep1.depend();
        dep2.depend();
        called += 1;
      });
      expect(called).toBe(1);

      await Autorun.onceAsync(async () => {
        await Autorun.onceAsync(async () => {
          dep1.changed();
          await Promise.resolve();
          dep2.changed();
          expect(called).toBe(1);
        });
        expect(called).toBe(1);
      });

      expect(called).toBe(2);

      autorun.dispose();
    });

    it('should forward the return value', async () => {
      expect(await Autorun.onceAsync(() => Promise.resolve(2))).toBe(2);
    });

    it('should resume on error', async () => {
      const dep = new Dependency('dep');
      let called = 0;
      const autorun = Autorun.start('main', () => {
        dep.depend();
        called += 1;
      });
      expect(called).toBe(1);

      const error = new Error('test');
      try {
        await Autorun.onceAsync(async () => {
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

      autorun.dispose();
    });
  });

  describe('the exclude function', () => {
    it('should run the callback outside of any autorun', () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let called = 0;
      const autorun = Autorun.start('main', () => {
        dep1.depend();
        Autorun.exclude(() => {
          dep2.depend();
        });
        called += 1;
      });
      expect(called).toBe(1);

      dep1.changed();
      expect(called).toBe(2);

      dep2.changed();
      expect(called).toBe(2);

      autorun.dispose();
    });

    it('should forward the return value', () => {
      let result: number | undefined;
      const autorun = Autorun.start('main', () => {
        result = Autorun.exclude(() => 2);
      });
      expect(result).toBe(2);
      autorun.dispose();
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

      const auto1 = Autorun.start('main', () => {
        count1 += 1;
        dep1.depend();
        dep2.changed();
      });

      const auto2 = Autorun.start('main', () => {
        count2 += 1;
        dep2.depend();
        dep3.changed();
      });

      expect(() => {
        Autorun.start('main', () => {
          count3 += 1;
          dep3.depend();
          dep1.changed();
        });
      }).toThrow(CircularDependencyError);

      expect(count1).toBe(2);
      expect(count2).toBe(2);
      expect(count3).toBe(2);

      auto1.dispose();
      auto2.dispose();
    });

  it('should throw an error when a circular dependency is detected between ' +
    'async autoruns', async () => {
      const sleep = () => new Promise((resolve) => setTimeout(resolve, 0));

      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');

      // 1. run auto1
      // 2. run auto2 -> dep1 changed -> run auto1 -> dep2 changed -> run auto2
      //        -> dep1 changed -> error!

      const auto1 = Autorun.start('main', async (comp) => {
        dep1.depend();
        await sleep();
        comp.continue(() => {
          dep2.changed();
        });
      });
      await auto1.value;

      const auto2 = Autorun.start('main', async (comp) => {
        dep2.depend();
        await sleep();
        comp.continue(() => {
          dep1.changed();
        });
      });
      await auto2.value;
      await auto1.value;

      let error;
      try {
        await auto2.value;
      } catch (err) {
        error = err;
      }
      expect(error instanceof Error).toBe(true);

      auto1.dispose();
      auto2.dispose();
    });

  it('should throw an error when a circular dependency is detected between ' +
    'multiple segments of the same async autorun', async () => {
      const dep = new Dependency('dep');
      let count = 0;
      const autorun = Autorun.start('main', async (comp) => {
        count += 1;
        dep.depend();
        await Promise.resolve();
        comp.continue(() => {
          dep.changed();
        });
      });

      let error;
      try {
        await autorun.value;
      } catch (err) {
        error = err;
      }
      expect(error instanceof CircularDependencyError).toBe(true);
      expect(count).toBe(1);
      autorun.dispose();
    });

  it('should throw an error when a circular dependency is detected between two ' +
    'forks', () => {
      const dep1 = new Dependency('dep1');
      const dep2 = new Dependency('dep2');
      let count1 = 0;
      let count2 = 0;
      expect(() => {
        Autorun.start('main', (comp) => {
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
        });
      }).toThrow(CircularDependencyError);
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
      Autorun.start('main', (comp) => {
        comp.fork('sub1', () => {
          count1 += 1;
          nodes.depend();
          result.changed();
        });
        comp.fork('sub2', () => {
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
    });
});
