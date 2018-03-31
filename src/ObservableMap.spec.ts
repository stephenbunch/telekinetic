import Autorun from './Autorun';
import ObservableMap from './ObservableMap';

describe('ObservableMap', () => {
  it('should track a dependency when getting the size', () => {
    const map = new ObservableMap<number, string>();
    let size = null;
    let called = 0;
    const auto = Autorun.start(() => {
      called += 1;
      size = map.size;
    });
    map.set(1, 'hello');
    expect(size).toBe(1);
    map.set(2, 'world');
    expect(size).toBe(2);
    // Changing the value of a key should not trigger a change.
    map.set(1, 'foo');
    expect(called).toBe(3);
    auto.dispose();
  });

  it('should track a dependency when getting a value', () => {
    const map = new ObservableMap<string, string>();
    let called = 0;
    let value = null;
    const auto = Autorun.start(() => {
      called += 1;
      value = map.get('foo');
    });
    map.set('foo', 'bar');
    expect(value).toBe('bar');
    expect(called).toBe(2);
    // Setting a different key should not trigger a change.
    map.set('hello', 'world');
    expect(called).toBe(2);
    auto.dispose();
  });

  it('should track a dependency when getting the keys', () => {
    const map = new ObservableMap<string, number>();
    const output: Array<Array<string>> = [];
    const auto = Autorun.start(() => {
      output.push(Array.from(map.keys()));
    });
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
    auto.dispose();
  });

  it('should track a dependency when getting the values', () => {
    const map = new ObservableMap<string, number>();
    const output: Array<Array<number>> = [];
    const auto = Autorun.start(() => {
      output.push(Array.from(map.values()));
    });
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
    auto.dispose();
  });

  it('should track a dependency when getting the entries', () => {
    const map = new ObservableMap<string, number>();
    const output: Array<Array<[string, number]>> = [];
    const auto = Autorun.start(() => {
      output.push(Array.from(map.entries()));
    });
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
    auto.dispose();
  });

  it('should track a dependency when getting the iterator', () => {
    const map = new ObservableMap<string, number>();
    const output: Array<Array<[string, number]>> = [];
    const auto = Autorun.start(() => {
      output.push(Array.from(map[Symbol.iterator]()));
    });
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
    auto.dispose();
  });

  it('should track a dependency when determining whether a key exists', () => {
    const map = new ObservableMap<string, number>();
    let has = null;
    let called = 0;
    const auto = Autorun.start(() => {
      called += 1;
      has = map.has('foo');
    });
    expect(has).toBe(false);
    map.set('foo', 2);
    expect(has).toBe(true);
    // Changing the value should not trigger a change.
    map.set('foo', 3);
    expect(called).toBe(2);
    map.delete('foo');
    expect(has).toBe(false);
    auto.dispose();
  });
});
