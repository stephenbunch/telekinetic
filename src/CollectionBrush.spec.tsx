import { CollectionBrush } from './CollectionBrush';
import { CollectionBrushStore } from './CollectionBrushStore';
import { mount } from 'enzyme';
import { observable } from './observable';
import { ReactiveComponent } from './ReactiveComponent';
import * as React from 'react';
import { observer, computed } from './computed';

interface Item { message: string, count: number }

class ItemBrush extends CollectionBrush<number, Item, string> {
  name = 'itemBrush';
}

@observer
class TestComponent extends ReactiveComponent {
  name = 'testComponent';

  data = new CollectionBrushStore<number, Item>();

  count = 0;

  @observable
  getSortKey: ((item: Item) => string) | undefined
    = (item: Item) => item.message;

  @observable
  renderItem = (item: Item) => {
    item.count += 1;
    return <li>{item.message}</li>
  };

  @computed
  get element(): React.ReactNode {
    this.count += 1;
    return (
      <ul>
        <ItemBrush
          name="brush"
          data={this.data}
          render={this.renderItem}
          sort={this.getSortKey}
        />
      </ul>
    );
  }
}

describe('CollectionBrush', () => {
  it('should only render items once', () => {
    const wrapper = mount(<TestComponent />);
    const inst = wrapper.instance() as TestComponent;

    const item1 = { message: 'foo', count: 0 };
    inst.data.set(1, item1);
    expect(wrapper.html()).toBe('<ul><li>foo</li></ul>');

    let item2 = { message: 'bar', count: 0 };
    inst.data.set(2, item2);
    expect(wrapper.html()).toBe('<ul><li>bar</li><li>foo</li></ul>');
    expect(item1.count).toBe(1);
    expect(item2.count).toBe(1);

    item2 = { message: 'qux', count: item2.count };
    inst.data.set(2, item2);
    expect(wrapper.html()).toBe('<ul><li>foo</li><li>qux</li></ul>');
    expect(item1.count).toBe(1);
    expect(item2.count).toBe(2);

    inst.data.delete(2);
    expect(item1.count).toBe(1);
    expect(item2.count).toBe(2);
    expect(wrapper.html()).toBe('<ul><li>foo</li></ul>');

    expect(inst.count).toBe(1);
    inst.renderItem = (item: Item) => {
      item.count += 1;
      return <li>{item.message.toUpperCase()}</li>;
    };
    expect(inst.count).toBe(2);

    expect(item1.count).toBe(2);
    expect(wrapper.html()).toBe('<ul><li>FOO</li></ul>');

    inst.getSortKey = undefined;
    expect(inst.count).toBe(3);
    expect(item1.count).toBe(2);
    expect(wrapper.html()).toBe('<ul><li>FOO</li></ul>');

    wrapper.unmount();
  });
});
