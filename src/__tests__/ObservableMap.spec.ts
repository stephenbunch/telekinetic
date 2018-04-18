import { ObservableMap } from '../ObservableMap';
import { observe } from '../rxjs/observe';
import { Uri } from '../Uri';

describe('ObservableMap', () => {
  it('should track a dependency when getting the size', () => {
    const map = new ObservableMap<number, string>(Uri.create('map'));
    let size = null;
    let called = 0;
    const sub = observe('main', () => {
      called += 1;
      size = map.size;
    }).subscribe();
    map.set(1, 'hello');
    expect(size).toBe(1);
    map.set(2, 'world');
    expect(size).toBe(2);
    // Changing the value of a key should not trigger a change.
    map.set(1, 'foo');
    expect(called).toBe(3);
    sub.unsubscribe();
  });

  it('should track a dependency when getting a value', () => {
    const map = new ObservableMap<string, string>(Uri.create('map'));
    let called = 0;
    let value = null;
    const sub = observe('main', () => {
      called += 1;
      value = map.get('foo');
    }).subscribe();
    map.set('foo', 'bar');
    expect(value).toBe('bar');
    expect(called).toBe(2);
    // Setting a different key should not trigger a change.
    map.set('hello', 'world');
    expect(called).toBe(2);
    sub.unsubscribe();
  });

  it('should track a dependency when getting the keys', () => {
    const map = new ObservableMap<string, number>(Uri.create('map'));
    const output: Array<Array<string>> = [];
    const sub = observe('main', () => {
      output.push(Array.from(map.keys()));
    }).subscribe();
    map.set('foo', 2);
    map.set('bar', 2);
    // Changing the value of a key should not trigger a change.
    map.set('bar', 42);
    map.delete('foo');
    expect(output).toEqual([
      [],
      ['foo'],
      ['foo', 'bar'],
      ['bar'],
    ]);
    sub.unsubscribe();
  });

  it('should track a dependency when getting the values', () => {
    const map = new ObservableMap<string, number>(Uri.create('map'));
    const output: Array<Array<number>> = [];
    const sub = observe('main', () => {
      output.push(Array.from(map.values()));
    }).subscribe();
    map.set('foo', 2);
    map.set('bar', 2);
    map.set('bar', 42);
    map.delete('foo');
    expect(output).toEqual([
      [],
      [2],
      [2, 2],
      [2, 42],
      [42],
    ]);
    sub.unsubscribe();
  });

  it('should track a dependency when getting the entries', () => {
    const map = new ObservableMap<string, number>(Uri.create('map'));
    const output: Array<Array<[string, number]>> = [];
    const sub = observe('main', () => {
      output.push(Array.from(map.entries()));
    }).subscribe();
    map.set('foo', 2);
    map.set('bar', 2);
    map.set('bar', 42);
    map.delete('foo');
    expect(output).toEqual([
      [],
      [['foo', 2]],
      [['foo', 2], ['bar', 2]],
      [['foo', 2], ['bar', 42]],
      [['bar', 42]],
    ]);
    sub.unsubscribe();
  });

  it('should track a dependency when getting the iterator', () => {
    const map = new ObservableMap<string, number>(Uri.create('map'));
    const output: Array<Array<[string, number]>> = [];
    const sub = observe('main', () => {
      output.push(Array.from(map[Symbol.iterator]()));
    }).subscribe();
    map.set('foo', 2);
    map.set('bar', 2);
    map.set('bar', 42);
    map.delete('foo');
    expect(output).toEqual([
      [],
      [['foo', 2]],
      [['foo', 2], ['bar', 2]],
      [['foo', 2], ['bar', 42]],
      [['bar', 42]],
    ]);
    sub.unsubscribe();
  });

  it('should track a dependency when determining whether a key exists', () => {
    const map = new ObservableMap<string, number>(Uri.create('map'));
    let has = null;
    let called = 0;
    const sub = observe('main', () => {
      called += 1;
      has = map.has('foo');
    }).subscribe();
    expect(has).toBe(false);
    map.set('foo', 2);
    expect(has).toBe(true);
    // Changing the value should not trigger a change.
    map.set('foo', 3);
    expect(called).toBe(2);
    map.delete('foo');
    expect(has).toBe(false);
    sub.unsubscribe();
  });
});
