import { suspend, resume } from './Computation';

export function batchUpdate<T>(callback: () => T): T {
  try {
    suspend();
    return callback();
  } finally {
    resume();
  }
}

export function batchUpdateAsync<T>(callback: () => Promise<T>): Promise<T> {
  suspend();
  return callback().then((result) => {
    resume();
    return result;
  }, (err) => {
    resume();
    throw err;
  });
}
