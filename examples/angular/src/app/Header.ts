import { Component } from '@angular/core';
import { TodoService } from './TodoService';
import { TodoTextInputMode } from './TodoTextInput';

@Component({
  selector: 'Header',
  templateUrl: './Header.html',
})
export class HeaderComponent {
  readonly inputMode = TodoTextInputMode.New;

  constructor(public todoService: TodoService) { }
}
