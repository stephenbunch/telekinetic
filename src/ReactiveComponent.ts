import * as React from 'react';
import Autorun from './Autorun';
import Computation from './Computation';
import IAutorun from './IAutorun';
import ObservableObject from './ObservableObject';

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
    this.reactiveProps = ObservableObject.fromJS(this.props);
  }

  abstract compute(props: Readonly<P>): React.ReactNode;

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
        computation.fork(() => {
          let result = this.compute(this.reactiveProps);
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
      });
    }
    this.rendering = false;
    return this.result;
  }
}

export default ReactiveComponent;
