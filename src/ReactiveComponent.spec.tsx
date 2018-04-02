import { Computation } from './Computation';
import { observable } from './observable';
import { ReactiveComponent } from './ReactiveComponent';
import { mount } from 'enzyme';
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
    const wrapper = mount(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    jest.spyOn(inst, 'forceUpdate');
    expect(wrapper.contains(<div>hello!</div>)).toBe(true);
    inst.message = 'goodbye';
    expect(inst.forceUpdate).toHaveBeenCalled();
    wrapper.update();
    expect(wrapper.contains(<div>goodbye!</div>)).toBe(true);
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });

  it('should automatically update when props change', () => {
    const wrapper = mount(<Test end="!" />);
    const inst = wrapper.instance() as Test;
    expect(wrapper.contains(<div>hello!</div>)).toBe(true);
    wrapper.setProps({ end: '.' });
    expect(wrapper.contains(<div>hello.</div>)).toBe(true);
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });
});
