import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app/App';
import { FilterLinkComponent } from './app/FilterLink';
import { FooterComponent } from './app/Footer';
import { HeaderComponent } from './app/Header';
import { MainSectionComponent } from './app/MainSection';
import { TodoItemComponent } from './app/TodoItem';
import { TodoListComponent } from './app/TodoList';
import { TodoTextInputComponent } from './app/TodoTextInput';

import { TodoService } from './app/TodoService';

@NgModule({
  declarations: [
    AppComponent,
    FilterLinkComponent,
    FooterComponent,
    HeaderComponent,
    MainSectionComponent,
    TodoItemComponent,
    TodoListComponent,
    TodoTextInputComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
  ],
  providers: [
    TodoService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
