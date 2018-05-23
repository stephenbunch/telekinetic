import { Component, ChangeDetectorRef, Input } from '@angular/core';
import { Observable, Computed } from '../../../../src';
import { ObserverComponent } from './ObserverComponent';
import { TodoVisibilityFilter, TodoService } from './TodoService';

@Component({
  selector: 'FilterLink',
  templateUrl: './FilterLink.html',
})
export class FilterLinkComponent extends ObserverComponent {
  constructor(
    changeDetector: ChangeDetectorRef,
    private todoService: TodoService,
  ) {
    super(changeDetector);
  }

  @Computed()
  get isActive() {
    return this.filter === this.todoService.visibilityFilter;
  }

  @Input()
  @Observable()
  filter = TodoVisibilityFilter.All;

  setFilter() {
    this.todoService.visibilityFilter = this.filter;
  }
}
