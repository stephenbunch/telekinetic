import { OrderedSet } from './OrderedSet';

describe('OrderedSet', () => {
  it('should sort', () => {
    const set = new OrderedSet<{ foo: string }>();
    set.add({ foo: 'a' });
    set.add({ foo: 'c' });
    set.add({ foo: 'b' });
    set.sort((item) => item.foo);
    expect(set.toArray().map((x) => x.foo)).toEqual(['a', 'b', 'c']);
  });
});
