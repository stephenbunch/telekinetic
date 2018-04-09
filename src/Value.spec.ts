import { observe } from './observe';
import { Value } from './Value';

it('should register a dependency', () => {
  const val = new Value('val', 1);
  const next = jest.fn();
  const sub = observe('main', () => val.get()).subscribe(next);
  expect(next).toHaveBeenCalledWith(1);
  val.set(2);
  expect(next).toHaveBeenCalledWith(2);
  val.set(2);
  expect(next).toHaveBeenCalledTimes(2);
  sub.unsubscribe();
});
