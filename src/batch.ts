import { OrderedSet } from './OrderedSet';

let suspendCount = 0;
let keys = new Set();
let queue: Array<() => any> = [];

function suspend(): void {
  suspendCount += 1;
}

function resume(): void {
  if (suspendCount > 0) {
    suspendCount -= 1;
    if (suspendCount === 0) {
      const callbacks = queue;
      queue = [];
      keys = new Set();
      for (const callback of callbacks) {
        callback();
      }
    }
  }
}

export function enqueue(callback: () => any, key?: any) {
  if (suspendCount > 0) {
    if (key) {
      if (!keys.has(key)) {
        keys.add(key);
        queue.push(callback);
      }
    } else {
      queue.push(callback);
    }
  } else {
    callback();
  }
}

export function batch<T>(callback: () => T): T {
  try {
    suspend();
    return callback();
  } finally {
    resume();
  }
}

export function batchAsync<T>(callback: () => Promise<T>): Promise<T> {
  suspend();
  return callback().then((result) => {
    resume();
    return result;
  }, (err) => {
    resume();
    throw err;
  });
}
