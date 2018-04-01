import { Computation } from './Computation';
import { observable } from './observable';
import { ReactiveComponent } from './ReactiveComponent';
import { shallow } from 'enzyme';
import * as React from 'react';

interface Props {
  end: string
}

class Test extends ReactiveComponent<Props> {
  @observable
  message = 'hello'

  renderCount = 0;

  @observable
  text = '';

  construct(props: Readonly<Props>, computation: Computation) {
    this.text = this.message + props.end;
  }

  compute(props: Readonly<Props>) {
    this.renderCount += 1;
    return <div>{this.text}</div>;
  }
}

describe('ReactiveComponent', () => {
  it('should automatically update when observable changes', () => {
    const wrapper = shallow(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello!</div>));
    inst.message = 'goodbye';
    expect(wrapper.contains(<div>goodbye!</div>));
    expect(inst.renderCount).toBe(2);
  });

  it('should automatically update when props change', () => {
    const wrapper = shallow(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello!</div>));
    wrapper.setProps({ end: '.' });
    expect(wrapper.contains(<div>hello.</div>));
    expect(inst.renderCount).toBe(2);
  });
});
