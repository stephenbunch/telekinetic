import { Component, ChangeDetectorRef } from '@angular/core';
import { TodoService } from './TodoService';
import { ObserverComponent } from './ObserverComponent';

@Component({
  selector: 'TodoList',
  templateUrl: './TodoList.html',
})
export class TodoListComponent extends ObserverComponent {
  constructor(changeDetector: ChangeDetectorRef,
    public todoService: TodoService) {
    super(changeDetector);
  }
}
