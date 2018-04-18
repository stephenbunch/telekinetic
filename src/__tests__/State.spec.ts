import { observe } from '../rxjs/observe';
import { State } from '../State';
import { Uri, NameSegment, IndexSegment } from '../Uri';

describe.only('State', () => {
  it('should set a value', () => {
    const state = new State();
    const foo = state.findOrCreate(Uri.create('foo'));
    foo.set('hello');
    expect(state.get()).toEqual({
      foo: 'hello',
    });
    foo.delete();
    expect(state.get()).toEqual({});
  });

  it('should set a nested value', () => {
    const state = new State();
    const bar = state.findOrCreate(Uri.create('foo', 'bar'));
    const baz = state.findOrCreate(Uri.create('foo', 'baz'));
    bar.set('hello');
    baz.set('world');
    expect(state.get()).toEqual({
      foo: {
        bar: 'hello',
        baz: 'world',
      },
    });
    bar.delete();
    expect(state.get()).toEqual({
      foo: {
        baz: 'world',
      },
    });
    baz.delete();
    expect(state.get()).toEqual({ foo: {} });
  });

  it('should find existing state node', () => {
    const state = new State();
    state.set({ foo: { bar: 'hello', baz: 'world' } });
    expect(state.get()).toEqual({
      foo: {
        bar: 'hello',
        baz: 'world',
      },
    });
    const bar = state.findOrCreate(Uri.create('foo', 'bar'));
    bar.set(12);
    expect(state.get()).toEqual({
      foo: {
        bar: 12,
        baz: 'world',
      },
    });
    bar.delete();
    expect(state.get()).toEqual({
      foo: {
        baz: 'world',
      },
    });
  });

  it('should find existing items in an array', () => {
    const state = new State();
    state.set({ foo: [1, 2, 3] });
    const a = state.findOrCreate(Uri.create('foo', 0));
    const b = state.findOrCreate(Uri.create('foo', 1));
    a.set(101);
    b.set(102);
    expect(state.get()).toEqual({ foo: [101, 102, 3] });
    a.delete();
    expect(state.get()).toEqual({ foo: [102, 3] });
    b.delete();
    expect(state.get()).toEqual({ foo: [3] });
  });

  it('should be observable', () => {
    const state = new State();
    const next = jest.fn();
    const sub = observe('state', () => state.get()).subscribe(next);
    expect(next).toHaveBeenCalledWith(undefined);
    const bar = state.findOrCreate(Uri.create('foo', 0, 'bar'));
    expect(next).toHaveBeenCalledWith({
      foo: [{
        bar: undefined,
      }],
    });
    bar.set('hello');
    expect(next).toHaveBeenCalledWith({
      foo: [{
        bar: 'hello',
      }],
    });
    bar.delete();
    expect(next).toHaveBeenCalledWith({
      foo: [{}],
    });
    sub.unsubscribe();
  });
});
