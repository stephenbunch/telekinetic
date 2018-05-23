import { Component, ChangeDetectorRef, Input, HostBinding } from '@angular/core';
import { Observable } from '../../../../src';
import { ObserverComponent } from './ObserverComponent';
import { TodoTextInputMode } from './TodoTextInput';
import { Todo, TodoService } from './TodoService';

@Component({
  selector: 'li.todo-item',
  templateUrl: './TodoItem.html',
})
export class TodoItemComponent extends ObserverComponent {
  readonly editMode = TodoTextInputMode.Edit;

  constructor(
    changeDetector: ChangeDetectorRef,
    private todoService: TodoService,
  ) {
    super(changeDetector);
  }

  @HostBinding('class.completed')
  get todoCompleted() {
    return this.todo && this.todo.completed;
  }

  @HostBinding('class.editing')
  @Observable()
  isEditing = false;

  @Input()
  @Observable()
  todo: Todo | null = null;

  save(text: string) {
    if (text) {
      this.todoService.editTodo(this.todo!.id, text);
    } else {
      this.todoService.deleteTodo(this.todo!.id);
    }
    this.isEditing = false;
  }

  delete() {
    this.todoService.deleteTodo(this.todo!.id);
  }

  complete() {
    this.todoService.toggleTodoCompleted(this.todo!.id);
  }
}
