import { observe } from '../rxjs/observe';
import { Value } from '../Value';
import { Uri } from '../Uri';
import { State } from '../State';

it('should register a dependency', () => {
  const val = new Value(Uri.create('val'), 1, false);
  const next = jest.fn();
  const sub = observe('main', () => val.get()).subscribe(next);
  expect(next).toHaveBeenCalledWith(1);
  val.set(2);
  expect(next).toHaveBeenCalledWith(2);
  val.set(2);
  expect(next).toHaveBeenCalledTimes(2);
  sub.unsubscribe();
});

it('should persist value in view state', () => {
  const foo = new Value(Uri.create('foo'), 1, true);
  const state = new State();
  Value.viewState = state;
  const next = jest.fn();
  const sub = observe('main', () => foo.get()).subscribe(next);
  expect(next).toHaveBeenCalledWith(1);
  expect(state.get()).toEqual({
    foo: 1,
  });
  foo.set(42);
  expect(next).toHaveBeenCalledWith(42);
  expect(state.get()).toEqual({
    foo: 42,
  });
  expect(next).toHaveBeenCalledTimes(2);
  sub.unsubscribe();
  Value.viewState = undefined;
});

it('should restore value from view state', () => {
  const foo = new Value(Uri.create('foo'), 1, true);
  const state = new State();
  state.findOrCreate(foo.uri).set(42);
  Value.viewState = state;
  const next = jest.fn();
  const sub = observe('main', () => foo.get()).subscribe(next);
  expect(next).toHaveBeenCalledWith(42);
  expect(state.get()).toEqual({
    foo: 42,
  });
  expect(next).toHaveBeenCalledTimes(1);
  sub.unsubscribe();
  Value.viewState = undefined;
});

it('should sync value from view state', () => {
  const foo = new Value(Uri.create('foo'), 1, true);
  const state = new State();
  Value.viewState = state;
  const next = jest.fn();
  const sub = observe('main', () => foo.get()).subscribe(next);
  expect(next).toHaveBeenCalledWith(1);
  expect(state.get()).toEqual({
    foo: 1,
  });
  state.findOrCreate(foo.uri).set(42);
  expect(next).toHaveBeenCalledWith(42);
  expect(state.get()).toEqual({
    foo: 42,
  });
  expect(next).toHaveBeenCalledTimes(2);
  sub.unsubscribe();
  Value.viewState = undefined;
});
