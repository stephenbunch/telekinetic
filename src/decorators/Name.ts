export const nameSymbol = Symbol('name');

export const Name = (name: string): ClassDecorator => (
  constructor: Function): void => {
  (constructor as any)[nameSymbol] = name;
};
