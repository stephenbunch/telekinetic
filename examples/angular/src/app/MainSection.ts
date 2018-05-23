import { Component, ChangeDetectorRef } from '@angular/core';
import { ObserverComponent } from './ObserverComponent';
import { TodoService } from './TodoService';
import { Computed } from '../../../../src';

@Component({
  selector: 'MainSection',
  templateUrl: './MainSection.html',
})
export class MainSectionComponent extends ObserverComponent {
  constructor(
    changeDetector: ChangeDetectorRef,
    public todoService: TodoService,
  ) {
    super(changeDetector);
  }

  @Computed()
  get completedCount() {
    return this.todoService.todos.filter((x) => x.completed).length;
  }

  get todosCount() {
    return this.todoService.todos.length;
  }
}
