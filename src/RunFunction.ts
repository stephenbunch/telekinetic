import Computation from './Computation';

type RunFunction<T> = (computation: Computation) => T;

export default RunFunction;
