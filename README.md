# Telekinetic

## Roadmap
- Add priority to computed async values. IMMEDIATE runs as a micro task using Promise.resolve. BACKGROUND runs in a new context setTimeout(0).
- Refactor reactive component as connect decorator. connect should take a name.
- Add computed decorator with options: async, priority.
- Add onChange event to computed values.
- Integrate with ZoneJS.
- Add visibleRange prop to collection brush.
- Remove observable set. Replace with Input.
- Refactor ObservableMap to use Value.
- Add StateTrace object for tracing top-level state changes.
- Add support for serializing current state.
- Add support for hot reload using serialized state.
- Add documentation, rollup bundle, code coverage, and blog post with codepen samples.
- Add debug tools. With ability to catch an error and rollback to previous state change.
- Refactor private members to use WeakSet.
