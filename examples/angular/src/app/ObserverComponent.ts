import {
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
  Inject,
} from '@angular/core';
import { autorun, Autorun } from '../../../../src/autorun';
import { Observable } from '../../../../src/decorators/Observable';

export class ObserverComponent implements OnInit, OnDestroy {
  private autorun: Autorun | null = null;

  constructor(private changeDetector: ChangeDetectorRef) {
    changeDetector.detach();
  }

  ngOnInit() {
    this.autorun = autorun(this.constructor.name, () => {
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.autorun) {
      this.autorun.dispose();
    }
  }
}
