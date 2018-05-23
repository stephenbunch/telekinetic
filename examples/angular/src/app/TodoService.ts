import { Injectable } from '@angular/core';
import {
  Action,
  Computed,
  Observable,
  ObservableMap,
  Uri,
} from '../../../../src';

@Injectable()
export class TodoService {
  private _guid = 0;

  private _todos = new ObservableMap<number, Todo>(Uri.create('todos'));

  constructor() {
    this.addTodo('Use Telekinetic');
  }

  @Observable()
  visibilityFilter = TodoVisibilityFilter.All;

  @Computed()
  get todos(): ReadonlyArray<Todo> {
    return Array.from(this._todos.values());
  }

  @Computed()
  get visibleTodos() {
    switch (this.visibilityFilter) {
      case TodoVisibilityFilter.Active:
        return this.todos.filter((x) => !x.completed);
      case TodoVisibilityFilter.Completed:
        return this.todos.filter((x) => x.completed);
      default:
        return this.todos;
    }
  }

  @Action()
  addTodo(text: string) {
    this._guid += 1;
    const todo = new Todo(this._guid, text, false);
    this._todos.set(todo.id, todo);
  }

  deleteTodo(id: number) {
    this._todos.delete(id);
  }

  editTodo(id: number, text: string) {
    const todo = this._todos.get(id)!;
    todo.text = text;
  }

  toggleTodoCompleted(id: number) {
    const todo = this._todos.get(id)!;
    todo.completed = !todo.completed;
  }

  @Action()
  completeAllTodos() {
    for (const todo of this._todos.values()) {
      todo.completed = true;
    }
  }

  @Action()
  clearCompleted() {
    for (const todo of this._todos.values()) {
      if (todo.completed) {
        this._todos.delete(todo.id);
      }
    }
  }
}

export class Todo {
  constructor(id: number, text: string, completed: boolean) {
    this.id = id;
    this.text = text;
    this.completed = completed;
  }

  @Observable()
  id: number;

  @Observable()
  text: string;

  @Observable()
  completed: boolean;
}

export enum TodoVisibilityFilter {
  All = 'All',
  Active = 'Active',
  Completed = 'Completed',
}

export const todoFilters = [
  TodoVisibilityFilter.All,
  TodoVisibilityFilter.Active,
  TodoVisibilityFilter.Completed,
];
