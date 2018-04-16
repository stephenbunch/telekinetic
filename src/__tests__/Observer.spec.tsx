import { ComputationContext } from '../ComputationContext';
import { mount } from 'enzyme';
import { Observable } from '../Observable';
import * as React from 'react';
import { Computed } from '../Computed';
import { Observer } from '../Observer';

interface Props {
  other: number
  end: string
}

@Observer()
class TestComponent extends React.Component<Props> {

  @Observable()
  message = 'hello'

  renderCount = 0;

  @Computed()
  get text() {
    return this.message + this.props.end;
  }

  render() {
    this.renderCount += 1;
    return <div>{this.text}</div>;
  }
}

describe('Observer', () => {
  it('should automatically update when observable changes', () => {
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
    expect(wrapper.html()).toBe('<div>hello!</div>');
    inst.message = 'goodbye';
    expect(wrapper.html()).toBe('<div>goodbye!</div>');
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });

  it('should automatically update when props change', () => {
    const wrapper = mount(<TestComponent end="!" other={0} />);
    const inst = wrapper.instance() as TestComponent;
    expect(wrapper.html()).toBe('<div>hello!</div>');
    wrapper.setProps({ other: 42 });
    wrapper.setProps({ end: '.' });
    expect(wrapper.html()).toBe('<div>hello.</div>');
    // Render count should be 2 because the 'other' property is not used.
    expect(inst.renderCount).toBe(2);
    wrapper.unmount();
  });
});
