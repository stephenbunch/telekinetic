import { autorun } from './autorun';
import { transaction, asyncTransaction } from './transaction';
import { Dependency } from './Dependency';

describe('transaction', () => {
  it('should suspend reruns', () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    const auto = autorun('main', () => {
      dep1.depend();
      dep2.depend();
      called += 1;
    });
    expect(called).toBe(1);

    transaction(() => {
      transaction(() => {
        dep1.changed();
        dep2.changed();
        expect(called).toBe(1);
      });
      expect(called).toBe(1);
    });

    expect(called).toBe(2);
    auto.dispose();
  });

  it('should forward the return value', () => {
    expect(transaction(() => 2)).toBe(2);
  });
});

describe('asyncTransaction', () => {
  it('should suspend reruns', async () => {
    const dep1 = new Dependency('dep1');
    const dep2 = new Dependency('dep2');
    let called = 0;
    const auto = autorun('main', () => {
      dep1.depend();
      dep2.depend();
      called += 1;
    });
    expect(called).toBe(1);

    await asyncTransaction(async () => {
      await asyncTransaction(async () => {
        dep1.changed();
        await Promise.resolve();
        dep2.changed();
        expect(called).toBe(1);
      });
      expect(called).toBe(1);
    });

    expect(called).toBe(2);
    auto.dispose();
  });

  it('should forward the return value', async () => {
    expect(await asyncTransaction(() => Promise.resolve(2))).toBe(2);
  });

  it('should resume on error', async () => {
    const dep = new Dependency('dep');
    let called = 0;
    const auto = autorun('main', () => {
      dep.depend();
      called += 1;
    });
    expect(called).toBe(1);

    const error = new Error('test');
    try {
      await asyncTransaction(async () => {
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

    auto.dispose();
  });
});
