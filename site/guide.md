# Exome

State management with plain classes. Put state in properties, mutations in methods, and derived values in getters. Subscribe to the instance you render.

This guide targets Exome 2.8.1. Check your installed version before using an API. For agent ingestion, read [the complete Markdown guide](/index.md) or [the index](/llms.txt).

## Install

```sh
npm install exome
```

Import the core from `exome`. Import framework adapters from their own subpaths; install the matching framework separately. No provider, reducer, decorator, or compiler plugin is required.

## Stores and actions

```ts
import { Exome } from 'exome';

export class Counter extends Exome {
  count = 0;

  get doubled() {
    return this.count * 2;
  }

  increment() {
    this.count += 1;
  }
}

export const counter = new Counter();
counter.increment(); // count: 1, doubled: 2
```

- Use prototype methods for actions. They are bound to the instance, so passing `counter.increment` as a callback preserves `this`.
- Actions notify subscribers when they finish, even when no property changes. Exome does not track individual property reads or writes.
- Getters compute on access; they are not memoized actions.
- Arrow-function fields are not wrapped as actions. Direct assignments and array mutations outside an action do not notify subscribers.
- A custom constructor must call `super()`. Keep one instance per intended lifetime: shared for app state, local for isolated state, and per request on a server.

## Async actions

An async action notifies when its returned promise settles, not after each assignment or `await`. Call `update(this)` when an intermediate state must be visible. Errors still reject the returned promise.

```ts
import { Exome, update } from 'exome';

export class Profile extends Exome {
  name = '';
  loading = false;

  async load(readName: () => Promise<string>) {
    this.loading = true;
    update(this);
    try {
      this.name = await readName();
    } finally {
      this.loading = false;
    }
  }
}

const profile = new Profile();
await profile.load(async () => 'Ada');
```

For concurrent requests, handle cancellation or stale results in the action. Exome does not order requests for you. Catch failures at the caller or store an explicit error state.

## Nested stores

Model independent entities as child stores. A child action notifies that child, not its parent. Subscribe where each instance is rendered; subscribe to the parent for additions, removals, and replacements.

```ts
import { Exome } from 'exome';

export class Todo extends Exome {
  done = false;
  constructor(public title = '') { super(); }
  toggle() { this.done = !this.done; }
}

export class TodoList extends Exome {
  items: Todo[] = [];
  add(title: string) { this.items.push(new Todo(title)); }
  remove(todo: Todo) {
    this.items = this.items.filter(item => item !== todo);
  }
}
```

Render the list with a parent subscription and each row with a child subscription. A parent getter that reads child state does not create a dependency subscription. Keep derived UI subscribed to every instance it reads.

## Subscribe and integrate

`subscribe(store, callback)` returns an unsubscribe function. It does not call the callback immediately. Render once yourself, then subscribe. Release the subscription when the view is destroyed.

```ts
import { subscribe } from 'exome';
import { counter } from './counter.js';

const render = () => { console.log(counter.count); };
render();
const stop = subscribe(counter, render);
counter.increment();
stop();
```

Use `update(store)` after an external mutation when an action is impractical. `updateAll()` notifies all currently subscribed instances; prefer targeted updates.

### React and Preact

```tsx
import { useStore } from 'exome/react';
import { counter } from './counter.js';

export function CounterView() {
  const { count, increment } = useStore(counter);
  return <button onClick={increment}>{count}</button>;
}
```

For Preact, import `useStore` from `exome/preact`. Both return the store and subscribe the component to its updates. Keep store creation outside repeated renders, or initialize it once with the framework's state initializer.

### Other adapters

| Import | Use | Read the value |
| --- | --- | --- |
| `exome/vue` | `useStore(store)` in setup | Destructure returned refs; templates unwrap them. Nested stores need their own subscriptions. |
| `exome/lit` | `new StoreController(this, store)` | `controller.store`; connects and disconnects with the host. |
| `exome/svelte` | `useStore(store, s => s.count)` | A Svelte store: `$count` in a component, or `.subscribe(fn)`. |
| `exome/solid` | `useStore(store, s => s.count)` | An accessor: `count()` in a reactive expression. |
| `exome/angular` | `useStore(store, s => s.count)` in an injection context | A signal: `count()` in the template. |
| `exome/rxjs` | `observableFromExome(store)` | Emits the store immediately and on updates. |

For Solid and Angular, select the primitive or changed reference you render. Returning the same mutable store reference can suppress updates through equality checks.

In 2.8.1, the Vue, Solid, Angular, and RxJS adapters do not reliably release the underlying Exome subscription on teardown. For short-lived views, use `subscribe` with your framework's explicit cleanup hook. With RxJS, return the Exome cleanup from an Observable's subscription function. Verify lifecycle behavior when upgrading.

## Action effects and middleware

`onAction(StoreClass, action, callback, timing?)` observes all instances of that class. Use `null` to observe all actions. Timing is `'after'` by default or `'before'`. The callback receives `(instance, action, payload, error, response)`; async after-effects run when the action settles.

```ts
import { onAction } from 'exome';
import { Counter } from './counter.js';

const stop = onAction(Counter, 'increment', store => {
  console.log(store.count);
});
// Call stop() when the effect's owner is disposed.
```

`addMiddleware(fn)` observes every store. Register before constructing stores if you need creation events. Its callback receives `(instance, action, payload)` before an action; return `(error, response) => void` for completion. Both APIs return cleanup functions. Call each cleanup once.

`NEW` and `LOAD_STATE` are lifecycle events. `NEW` completion runs in a microtask after construction. `runMiddleware(store, action, payload)` manually starts the middleware chain and returns its completion callback; call that callback once. Prefer normal methods for application actions.

## Save and load

```ts
import { registerLoadable, saveState, loadState } from 'exome/state';
import { Todo, TodoList } from './todo.js';

registerLoadable({ Todo, TodoList });
const list = new TodoList();
list.add('Ship the docs');
const snapshot = saveState(list);
list.items[0].toggle();
loadState(list, snapshot); // restores done: false
```

- `saveState(store, readable?)` returns JSON with Exome instance IDs. Pass `true` for indentation.
- Register every nested store class before saving and loading. Stable registration names survive class-name minification.
- `loadState(existingRoot, json)` mutates the root, reconstructs nested stores, and notifies subscribers. Recreated nested instances can have different object identities.
- Nested constructors must work without arguments and should avoid side effects. Use default constructor parameters.
- Treat snapshots as application data: validate their origin and schema. Serialization follows JSON limitations; functions, symbols, `undefined`, and arbitrary class prototypes are not persisted.
- Scope stores per request for SSR. Never share user state through a process-wide singleton.

## Debug and test

Register developer tools before creating stores. Enable them only in development.

```ts
import { addMiddleware } from 'exome';
import { exomeReduxDevtools } from 'exome/devtools';

const stop = addMiddleware(exomeReduxDevtools({ name: 'App' }));
```

`exomeReduxDevtools({ name?, maxAge?, actionsBlacklist? })` connects to Redux DevTools. `unstableExomeDevtools({ name?, maxAge?, ignoreListActions?, ignoreListStores? })` connects to Exome Developer Tools and remains experimental.

Test stores without a UI. Use a fresh instance per test, call an action, await async actions, and assert observable state. For notification behavior, subscribe before the action and release the subscription afterward. Use real `Exome` stores when testing actions; `GhostExome` from `exome/ghost` only provides an ID and does not wrap methods or notify.

## API notes

The sections above cover the core, state, devtools, and framework exports. These lower-level helpers are available when needed.

| Export | Contract |
| --- | --- |
| `getActionStatus(store, action)` from `exome/utils` | Cached status with `loading`, `error`, `response`, and `unsubscribe()`. Create it before invoking the action. The latest invocation controls the status; it does not cancel earlier actions. Call cleanup once when no consumer needs it. |
| `getExomeId(store)` from `exome` | Read the instance ID. |
| `setExomeId(store, id)` from `exome` | Replaces the ID suffix, preserving the class prefix. Set it before subscriptions; existing subscriptions are keyed by the old ID. |
| `exomeId`, `exomeName` from `exome` | Symbols for instance identity and class naming. Prefer ID helpers and `registerLoadable` for normal use. |

In 2.8.1, `getActionStatus().response` turns falsy results into `undefined`. Use the action's returned value when `0`, `false`, or an empty string is meaningful.

## Troubleshooting

- **No render after a mutation:** use a prototype method, or call `update(store)` after an external mutation. Arrow fields do not become actions.
- **Child changed but parent stayed stale:** subscribe to the child as well. Updates do not bubble through the store tree.
- **Loading indicator never appears:** publish the intermediate state with `update(this)`, or create `getActionStatus` before the action starts.
- **State resets on render:** stop constructing the store on every render.
- **A snapshot will not load:** register nested classes with stable names and make their constructors callable without arguments.
- **Leaked subscriptions:** own each cleanup explicitly; check the adapter limitations above.

Source of truth: [Exome source](https://github.com/Marcisbee/exome/tree/main/src), [package releases](https://www.npmjs.com/package/exome), and your installed package's types.
