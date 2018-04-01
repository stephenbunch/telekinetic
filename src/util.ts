import { ObservableMap } from './ObservableMap';
import { ObservableObject } from './ObservableObject';

export function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export function toJS(value: any): any {
  if (value instanceof ObservableMap) {
    return ObservableMap.toJS(value);
  } else if (ObservableObject.isObservable(value)) {
    return ObservableObject.toJS(value);
  } else {
    return value;
  }
}
