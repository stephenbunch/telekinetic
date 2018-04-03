import { Computation } from './Computation';
import { observable } from './observable';
import { ReactiveComponent } from './ReactiveComponent';
import { mount } from 'enzyme';
import * as React from 'react';

interface Props {
  other: number
  end: string
}

class TestComponent extends ReactiveComponent<Props> {
  @observable
  message = 'hello'

  renderCount = 0;

  @observable
  text = '';

  construct(computation: Computation) {
    this.text = this.message + this.props.end;
  }

  compute() {
    this.renderCount += 1;
    return <div>{this.text}</div>;
  }
}

describe('ReactiveComponent', () => {
  it('should automatically update when observable changes', () => {
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
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
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
    expect(wrapper.contains(<div>hello!</div>)).toBe(true);
    wrapper.setProps({ other: 42 });
    wrapper.setProps({ end: '.' });
    expect(wrapper.contains(<div>hello.</div>)).toBe(true);
    // Render count should be 2 because the 'other' property is not used.
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });
});
