import * as React from 'react';
import { Autorun, IAutorun } from './Autorun';
import { Computation } from './Computation';
import { ObservableObject } from './ObservableObject';

export abstract class ReactiveComponent<P = {}> extends React.Component<P> {
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

  abstract construct(props: Readonly<P>, computation: Computation): any;

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
        computation.fork((comp) => this.construct(this.reactiveProps, comp));
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
