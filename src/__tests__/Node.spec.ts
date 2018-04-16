import { Uri, NameSegment, UidSegment } from '../Uri';
import { Node } from '../Node';

describe('Node', () => {
  it('should write a value', () => {
    const root = new Node();
    const uri = new Uri([new NameSegment('foo')]);
    const node = root.create(uri);
    node.write('hello');
    expect(root.getSnapshot()).toEqual({
      foo: 'hello',
    });
    node.delete();
    expect(root.getSnapshot()).toEqual({});
  });
});
