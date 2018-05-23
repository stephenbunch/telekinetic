import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Observable } from '../../../../src';
import { ObserverComponent } from './ObserverComponent';
import { todoFilters } from './TodoService';

@Component({
  selector: 'Footer',
  templateUrl: './Footer.html',
})
export class FooterComponent extends ObserverComponent {
  readonly todoFilters = todoFilters;

  @Input()
  @Observable()
  activeCount = 0;

  @Input()
  @Observable()
  completedCount = 0;

  @Output()
  clearCompleted = new EventEmitter<void>();

  constructor(changeDetector: ChangeDetectorRef) {
    super(changeDetector);
  }

  onClearCompleted() {
    this.clearCompleted.emit();
  }
}
