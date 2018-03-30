import * as React from 'react';
import Computation from './Computation';
import observable from './observable';
import ReactiveComponent from './ReactiveComponent';
import { shallow } from 'enzyme';

class Test extends ReactiveComponent {
  @observable
  message = 'hello'

  compute(props: {}, computation: Computation) {
    return <div>{this.message}</div>;
  }
}

describe('ReactiveComponent', () => {
  it('should automatically update', () => {
    const wrapper = shallow(<Test />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello</div>));
    inst.message = 'world';
    expect(wrapper.contains(<div>world</div>));
  });
});
