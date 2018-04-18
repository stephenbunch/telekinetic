const nameSymbol = Symbol('name');

export function getClassName(constructor: Function): string {
  return (constructor as any)[nameSymbol] || constructor.name
}

export const Name = (name: string): ClassDecorator => (
  constructor: Function): void => {
  (constructor as any)[nameSymbol] = name;
};
