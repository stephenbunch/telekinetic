import { Component, ChangeDetectorRef } from '@angular/core';
import { Observable } from '../../../../src/decorators/Observable';
import { ObserverComponent } from './ObserverComponent';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
})
export class AppComponent extends ObserverComponent {
  @Observable()
  title = 'hello';

  constructor(changeDetector: ChangeDetectorRef) {
    super(changeDetector);
  }

  onChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.title = input.value;
  }
}
