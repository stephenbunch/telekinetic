import { observable } from './observable';
import { shallow } from 'enzyme';
import * as React from 'react';
import Computation from './Computation';
import ReactiveComponent from './ReactiveComponent';

interface Props {
  end: string
}

class Test extends ReactiveComponent<Props> {
  @observable
  message = 'hello'

  computeCount = 0;

  compute(props: Readonly<Props>) {
    this.computeCount += 1;
    return <div>{`${this.message}${props.end}`}</div>;
  }
}

describe('ReactiveComponent', () => {
  it('should automatically update when observable changes', () => {
    const wrapper = shallow(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello!</div>));
    inst.message = 'world';
    expect(wrapper.contains(<div>world!</div>));
    expect(inst.computeCount).toBe(2);
  });

  it('should automatically update when props change', () => {
    const wrapper = shallow(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello!</div>));
    wrapper.setProps({ end: '.' });
    expect(wrapper.contains(<div>hello.</div>));
    expect(inst.computeCount).toBe(2);
  });
});
