import { Uri } from '../Uri';
import { autorun } from '../autorun';
import { Value } from '../Value';

describe('Uri', () => {
  it('should auto assign instance ids', () => {
    class Foo { };

    const foo1 = new Foo();
    const foo2 = new Foo();
    const uri1 = Uri.instance(foo1);
    const uri2 = Uri.instance(foo2);

    const flag = new Value(Uri.create('flag'), 1, false);

    let name1;
    let name2;

    const auto = autorun('main', () => {
      switch (flag.get()) {
        case 1:
          uri1.activate();
          name1 = uri1.toString();
          name2 = null;
          break;
        case 2:
          uri2.activate();
          name1 = null;
          name2 = uri2.toString();
          break;
        case 3:
          uri1.activate();
          uri2.activate();
          name1 = uri1.toString();
          name2 = uri2.toString();
          break;
      }
    });

    expect(name1).toBe('#Foo_0');
    expect(name2).toBeNull();

    flag.set(2);

    expect(name1).toBeNull();
    expect(name2).toBe('#Foo_0');

    flag.set(3);

    expect(name1).toBe('#Foo_0');
    expect(name2).toBe('#Foo_1');

    auto.dispose();
  });
});
