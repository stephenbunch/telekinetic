import { Component } from '@angular/core';
import { TodoService } from './TodoService';

@Component({
  selector: 'TodoList',
  templateUrl: './TodoList.html',
})
export class TodoListComponent {
  constructor(public todoService: TodoService) { }
}
