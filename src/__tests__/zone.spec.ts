import 'zone.js';
import { autorun, Dependency, Uri } from '../../src';
import { Deferred } from './testing/Deferred';

const asyncAutorun = (name: string, callback: Function) => {
  return autorun(name, (comp) => {
    const zone = Zone.current.fork({
      name,
      onInvokeTask(parentZoneDelegate: ZoneDelegate, currentZone: Zone,
        targetZone: Zone, task: Task, applyThis: any, applyArgs: any) {
        if (comp.isAlive) {
          return comp.continue(() =>
            parentZoneDelegate.invokeTask(
              targetZone, task, applyThis, applyArgs)
          );
        }
      },
    });
    zone.run(callback, undefined, [comp]);
  });
};

it('should work with zones', async () => {
  const dep1 = new Dependency(Uri.create('dep1'));
  const dep2 = new Dependency(Uri.create('dep2'));
  const output: string[] = [];
  const input1 = new Deferred<string>();
  const input2 = new Deferred<string>();
  const end = new Deferred();
  const auto = asyncAutorun('main', async () => {
    dep1.depend();
    output.push(await input1.promise);
    dep2.depend();
    output.push(await input2.promise);
    end.resolve();
  });
  
  // Since promise callbacks are executed as microtasks, quickly changing the
  // dependency causes the rest of the autorun to be disgarded.
  input1.resolve('hello');
  dep1.changed();
  expect(output).toEqual([]);

  await input1.promise;
  input2.resolve('world');
  dep2.changed();
  expect(output).toEqual(['hello']);

  await end.promise;
  expect(output).toEqual(['hello', 'hello', 'world']);
});
