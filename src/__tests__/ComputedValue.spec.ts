import { AsyncObserver } from './utils/AsyncObserver';
import { transaction } from '../transaction';
import { ComputedValue } from '../ComputedValue';
import { observe, observeAsync } from '../observe';
import { Value } from '../Value';

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

  sub1.unsubscribe();
});
