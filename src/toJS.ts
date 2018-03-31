import ObservableMap from './ObservableMap';
import ObservableObject from './ObservableObject';

function toJS(value: any): any {
  if (value instanceof ObservableMap) {
    return ObservableMap.toJS(value);
  } else if (ObservableObject.isObservable(value)) {
    return ObservableObject.toJS(value);
  } else {
    return value;
  }
}

export default toJS;
