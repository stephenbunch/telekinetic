import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { Observable, Computed } from '../../../../src';
import { ObserverComponent } from './ObserverComponent';

export enum TodoTextInputMode {
  New = 1,
  Edit = 2,
}

@Component({
  selector: 'TodoTextInput',
  templateUrl: './TodoTextInput.html',
})
export class TodoTextInputComponent extends ObserverComponent {
  constructor(changeDetector: ChangeDetectorRef) {
    super(changeDetector);
  }

  @Input()
  @Observable()
  text = '';

  @Input()
  @Observable()
  placeholder = '';

  @Input()
  @Observable()
  mode = TodoTextInputMode.New;

  @Output()
  save = new EventEmitter<string>();

  @Computed()
  get isEditMode() {
    return this.mode === TodoTextInputMode.Edit;
  }

  @Computed()
  get isNewMode() {
    return this.mode === TodoTextInputMode.New;
  }

  onBlur() {
    if (this.mode === TodoTextInputMode.Edit) {
      this.save.emit(this.text);
    }
  }

  submit(e: Event) {
    if (this.mode === TodoTextInputMode.New && !this.text) {
      return;
    }
    this.save.emit(this.text);
    if (this.mode === TodoTextInputMode.New) {
      this.text = '';
    }
  }
}
