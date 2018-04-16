import { ComputationContext } from './ComputationContext';
import { mount } from 'enzyme';
import { observable } from './observable';
import * as React from 'react';
import { computed } from './computed';
import { observer } from './observer';

interface Props {
  other: number
  end: string
}

@observer
class TestComponent extends React.Component<Props> {

  @observable
  message = 'hello'

  renderCount = 0;

  @computed
  get text() {
    return this.message + this.props.end;
  }

  render() {
    this.renderCount += 1;
    return <div>{this.text}</div>;
  }
}

describe('observer', () => {
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
