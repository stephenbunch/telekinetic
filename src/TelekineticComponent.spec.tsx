import * as React from 'react';
import Computation from './Computation';
import telekinetic from './telekinetic';
import TelekineticComponent from './TelekineticComponent';
import { shallow } from 'enzyme';

class Foo extends TelekineticComponent {
  @telekinetic
  message = 'hello'

  compute(props: {}, computation: Computation) {
    return <div>{this.message}</div>;
  }
}

describe('TelekineticComponent', () => {
  it('should automatically update', () => {
    const wrapper = shallow(<Foo />);
    const inst = wrapper.instance() as Foo;
    expect(wrapper.contains(<div>hello</div>));
    inst.message = 'world';
    expect(wrapper.contains(<div>world</div>));
  });
});
