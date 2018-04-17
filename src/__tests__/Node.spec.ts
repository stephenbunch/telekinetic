import { Uri, NameSegment, IndexSegment } from '../Uri';
import { Node } from '../Node';

describe('Node', () => {
  it('should write a value', () => {
    const tree = new Node();
    const foo = tree.findOrCreateChild(Uri.create('foo'));
    foo.write('hello');
    expect(tree.getSnapshot()).toEqual({
      foo: 'hello',
    });
    foo.delete();
    expect(tree.getSnapshot()).toEqual({});
  });

  it('should write a nested value', () => {
    const tree = new Node();
    const bar = tree.findOrCreateChild(Uri.create('foo', 'bar'));
    const baz = tree.findOrCreateChild(Uri.create('foo', 'baz'));
    bar.write('hello');
    baz.write('world');
    expect(tree.getSnapshot()).toEqual({
      foo: {
        bar: 'hello',
        baz: 'world',
      },
    });
    bar.delete();
    expect(tree.getSnapshot()).toEqual({
      foo: {
        baz: 'world',
      },
    });
    baz.delete();
    expect(tree.getSnapshot()).toEqual({ foo: {} });
  });

  it('should attach to existing node', () => {
    const tree = new Node();
    tree.write({ foo: { bar: 'hello', baz: 'world' } });
    expect(tree.getSnapshot()).toEqual({
      foo: {
        bar: 'hello',
        baz: 'world',
      },
    });
    const bar = tree.findOrCreateChild(Uri.create('foo', 'bar'));
    bar.write(12);
    expect(tree.getSnapshot()).toEqual({
      foo: {
        bar: 12,
        baz: 'world',
      },
    });
    bar.delete();
    expect(tree.getSnapshot()).toEqual({
      foo: {
        baz: 'world',
      },
    });
  });

  it('should attach to existing items in array', () => {
    const tree = new Node();
    tree.write({ foo: [1, 2, 3] });
    const a = tree.findOrCreateChild(Uri.create('foo', 0));
    const b = tree.findOrCreateChild(Uri.create('foo', 1));
    a.write(101);
    b.write(102);
    expect(tree.getSnapshot()).toEqual({ foo: [101, 102, 3] });
    a.delete();
    expect(tree.getSnapshot()).toEqual({ foo: [102, 3] });
    b.delete();
    expect(tree.getSnapshot()).toEqual({ foo: [3] });
  });
});
