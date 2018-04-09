import { ComputedValue, ComputedAsyncValue } from './ComputedValue';
import { observe, observeAsync } from './observe';
import { Value } from './Value';
import { AsyncObserver } from './testing';

it('should cache computed values', () => {
  const val1 = new Value('val1', 'foo');
  const val2 = new Value('val2', 'bar');
  const comp = jest.fn(() => val1.get() + val2.get());
  const val3 = new ComputedValue('val3', comp);
  const next1 = jest.fn();
  const sub1 = observe('auto1', () => {
    val3.get();
    return val3.get();
  }).subscribe(next1);
  expect(next1).toHaveBeenCalledWith('foobar');

  val2.set('qux');
  expect(next1).toHaveBeenCalledWith('fooqux');
  expect(next1).toHaveBeenCalledTimes(2);
  expect(comp).toHaveBeenCalledTimes(2);

  // Calling outside autorun should not use cache.
  expect(val3.get()).toBe('fooqux');
  expect(comp).toHaveBeenCalledTimes(3);

  // Calling in separate autorun should use different cache.
  const next2 = jest.fn();
  const sub2 = observe('auto2', () => val3.get()).subscribe(next2);
  expect(next2).toHaveBeenCalledWith('fooqux');
  expect(comp).toHaveBeenCalledTimes(4);

  // Value should be cached per computation.
  val1.set('bar');
  expect(next1).toHaveBeenCalledWith('barqux');
  expect(next2).toHaveBeenCalledWith('barqux');
  expect(comp).toHaveBeenCalledTimes(6);

  sub1.unsubscribe();

  // Only auto2 is active right now.
  val2.set('foo');
  expect(next2).toHaveBeenCalledWith('barfoo');
  expect(comp).toHaveBeenCalledTimes(7);

  sub2.unsubscribe();
});

it('should compute async values', async () => {
  const val1 = new Value('val1', 'foo');
  const val2 = new Value('val2', Promise.resolve('bar'));
  const comp = jest.fn(async () => val1.get() + await val2.get());
  const val3 = new ComputedAsyncValue('val3', comp);

  const obs = new AsyncObserver<string>();
  const sub = observeAsync('auto1', () => val3.get()).subscribe(obs);
  expect(await obs.promise).toBe('foobar');

  val1.set('qux');
  expect(await obs.promise).toBe('quxbar');

  val2.set(Promise.resolve('foo'));
  expect(await obs.promise).toBe('quxfoo');

  sub.unsubscribe();
});
