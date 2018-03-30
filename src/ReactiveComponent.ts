import * as React from 'react';
import Autorun from './Autorun';
import Computation from './Computation';
import IAutorun from './IAutorun';
import ReactiveProxy from './ReactiveProxy';

const PROPS = Symbol('PROPS');

interface State {
  [PROPS]: {}
}

abstract class ReactiveComponent<P = {}> extends React.Component<P> {
  private autorun: IAutorun | null = null;
  private result: React.ReactNode = null;
  private reactiveProps: P;
  private prevProps: P;
  private rendering = false;

  constructor(props: P, context?: any) {
    super(props, context);
    this.prevProps = this.props;
    this.reactiveProps = ReactiveProxy.from(this.props);
  }

  abstract compute(props: P, computation: Computation): React.ReactNode;

  componentWillUnmount() {
    if (this.autorun) {
      this.autorun.dispose();
      this.autorun = null;
    }
  }

  render() {
    this.rendering = true;
    Autorun.once(() => {
      if (this.props !== this.prevProps) {
        this.prevProps = this.props;
        Object.assign(this.reactiveProps, this.props);
      }
    });
    if (this.autorun === null) {
      this.autorun = Autorun.start((computation) => {
        let result = this.compute(this.reactiveProps, computation);
        if (result !== this.result) {
          this.result = result;
          if (!computation.isFirstRun) {
            Autorun.exclude(() => {
              if (!this.rendering) {
                this.forceUpdate();
              }
            });
          }
        }
      });
    }
    this.rendering = false;
    return this.result;
  }
}

export default ReactiveComponent;
