import { OrderedSet } from './OrderedSet';

describe('OrderedSet', () => {
  it('should sort', () => {
    const set = new OrderedSet<{ foo: string }>();
    set.push({ foo: 'a' });
    set.push({ foo: 'c' });
    set.push({ foo: 'b' });
    set.sort((item) => item.foo);
    expect(set.toArray().map((x) => x.foo)).toEqual(['a', 'b', 'c']);
  });
});
