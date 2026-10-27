# Exome

State management with plain classes. Put state in properties, mutations in methods, and derived values in getters. Subscribe to the instance you render.

This guide targets Exome 2.9.0. Version 2.9.0 adds [Radi support](#exome-radi) for reactive children and attributes. Check your installed version before using an API. For agent ingestion, read [the complete Markdown guide](/index.md) or [the index](/llms.txt).

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

Use `useStore(store)` inside the component and keep the instance stable across renders. See [exome/react](#exome-react) and [exome/preact](#exome-preact) for signatures and examples.

### Other adapters

| Import | Use | Read the value |
| --- | --- | --- |
| `exome/radi` | `useStore(store, s => s.count)` | A subscribable value: pass it directly as a Radi child or attribute. |
| `exome/vue` | `useStore(store)` in setup | Destructure returned refs; templates unwrap them. Nested stores need their own subscriptions. |
| `exome/lit` | `new StoreController(this, store)` | `controller.store`; connects and disconnects with the host. |
| `exome/svelte` | `useStore(store, s => s.count)` | A Svelte store: `$count` in a component, or `.subscribe(fn)`. |
| `exome/solid` | `useStore(store, s => s.count)` | An accessor: `count()` in a reactive expression. |
| `exome/angular` | `useStore(store, s => s.count)` in an injection context | A signal: `count()` in the template. |
| `exome/rxjs` | `observableFromExome(store)` | Emits the store immediately and on updates. |

For Solid and Angular, select the primitive or changed reference you render. Returning the same mutable store reference can suppress updates through equality checks.

In 2.9.0, the Vue, Solid, Angular, and RxJS adapters do not reliably release the underlying Exome subscription on teardown. For short-lived views, use `subscribe` with your framework's explicit cleanup hook. With RxJS, return the Exome cleanup from an Observable's subscription function. Verify lifecycle behavior when upgrading.

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

`exomeReduxDevtools({ name?, maxAge?, actionsBlacklist? })` connects to Redux DevTools. `unstableExomeDevtools({ name, maxAge?, ignoreListActions?, ignoreListStores? })` connects to Exome Developer Tools and remains experimental.

Test stores without a UI. Use a fresh instance per test, call an action, await async actions, and assert observable state. For notification behavior, subscribe before the action and release the subscription afterward. Use real `Exome` stores when testing actions; `GhostExome` from `exome/ghost` only provides an ID and does not wrap methods or notify.

## API notes

The reference below covers every public JavaScript entry point in Exome 2.9.0. Signatures show the calling contract; `T` is your store type and `R` is a selected value. Framework types come from the corresponding framework. Examples that import `./counter.js` use the Counter module in [Stores and actions](#stores-and-actions); `./todo.js` uses [Nested stores](#nested-stores).

Use Ctrl/Cmd F to search this page. The complete reference and examples are also in [index.md](/index.md), without navigation or a JavaScript requirement.

## exome

### Stores and notifications

| Export / signature | Contract |
| --- | --- |
| `class Exome` / `new Exome()` | Extend it to create a store. Prototype methods become bound actions. See [Stores and actions](#stores-and-actions). |
| `subscribe<T extends Exome>(store: T \| null \| undefined, callback: (store: T) => void): () => void` | Subscribe to one instance. No initial callback. Returns cleanup; nullish stores return a no-op cleanup. |
| `update(store: Exome): void` | Notify the instance's subscribers immediately. Does not run action middleware. |
| `updateAll(): void` | Notify subscribers of all instances. Prefer `update` for a known store. |

```ts
import { subscribe, update } from 'exome';
import { counter } from './counter.js';

const stop = subscribe(counter, store => console.log(store.count));
counter.count = 10; // assignment alone does not notify
update(counter);   // logs 10
stop();
```

### Action observation

| Export / signature | Contract |
| --- | --- |
| `onAction(StoreClass, action, callback, timing?): () => void` | Observe all instances of the class. `action` is a method key, `'NEW'`, `'LOAD_STATE'`, or `null` for every action. `timing` is `'before'` or `'after'` (default). |
| `type Middleware = (store: Exome, action: string, payload: any[]) => void \| ((error?: Error, response?: any) => void)` | The first callback runs before an action. Its optional returned callback runs after completion, including rejection or a thrown error. |
| `addMiddleware(middleware: Middleware): () => void` | Register global middleware; returns cleanup. Register before store creation to see `NEW`. |
| `runMiddleware(store: Exome, action: string, payload: any[]): (error?: Error, response?: any) => void` | Start a manual middleware event. Call the returned completion once. Completion also notifies the store, except for `NEW`. |

The `onAction` callback is `(instance, action, payload, error?, response?) => void`. Payload types are inferred from the method where possible. Before-callbacks have no completion result. After-callbacks wait for returned promises. These observers do not cancel or replace an action's result. Invoke cleanup once when the observer's owner is disposed.

```ts
import { addMiddleware } from 'exome';
import { Counter } from './counter.js';

const stop = addMiddleware((store, action, payload) => {
  if (!(store instanceof Counter) || action !== 'increment') return;
  return (error, response) => {
    console.log({ action, payload, error, response, count: store.count });
  };
});
const store = new Counter();
store.increment();
stop();
```

### Identity

| Export / signature | Contract |
| --- | --- |
| `getExomeId(store: Exome): string` | Read the ID, normally `ClassName-generatedSuffix`. |
| `setExomeId(store: Exome, id: string): void` | Replace only the suffix, preserving the class prefix. Set it before subscriptions; existing subscriptions remain keyed by the old ID. Keep IDs unique. |
| `exomeId: unique symbol` | Internal instance-ID key. Prefer the ID helpers. |
| `exomeName: unique symbol` | Class-name key. Prefer `registerLoadable` for stable serialized names. |

```ts
import { getExomeId, setExomeId } from 'exome';
import { Counter } from './counter.js';

const store = new Counter();
setExomeId(store, 'sidebar');
console.log(getExomeId(store)); // Counter-sidebar
```

## exome/state

| Export / signature | Contract |
| --- | --- |
| `registerLoadable(classes: Record<string, any>): void` | Register name-to-constructor mappings for nested stores. Use stable names before saving and loading. |
| `saveState(store: Exome, readable?: boolean): string` | Serialize state and Exome identities to JSON. `readable` defaults to `false`; `true` indents with two spaces. |
| `loadState(store: Exome, state: string): any` | Restore into an existing root and return the parsed root data without its ID. Rebuild nested instances and notify subscribers. Throws for invalid snapshots, missing registrations, or constructors that cannot run without arguments. |

See the complete [save/load example](#save-and-load). Restoration is assignment into the existing root, not replacement: properties absent from the snapshot are not deleted. JSON limitations apply; validate snapshots before loading them.

## exome/utils

`getActionStatus<E = Error, T extends Exome = any, R = any>(store: T, action: keyof T)` returns a cached status object:

| Property | Meaning |
| --- | --- |
| `loading: boolean` | `true` while the latest observed invocation is pending. |
| `error: false \| E` | `false` initially and on success; otherwise the completion error. |
| `response: void \| R` | The latest result. In 2.9.0, falsy values become `undefined`; use the action return value if `0`, `false`, or `''` matters. |
| `unsubscribe(): void` | Remove the shared observer and clear its cache entry. Call once when all consumers are finished. |

Create the status before invoking the action. Status changes notify the associated store. Tracking the latest call does not cancel earlier calls or prevent their state changes.

```ts
import { Exome } from 'exome';
import { getActionStatus } from 'exome/utils';

class Search extends Exome {
  async run() { return ['result']; }
}
const search = new Search();
const status = getActionStatus(search, 'run');
const pending = search.run();
console.log(status.loading); // true
await pending;
console.log(status.loading, status.response); // false, ['result']
status.unsubscribe();
```

## exome/devtools

Both exports return `Middleware`; pass the result to `addMiddleware` before constructing stores. Enable only in development with the matching browser extension installed. See [Debug and test](#debug-and-test).

| Export | Configuration |
| --- | --- |
| `exomeReduxDevtools(config): Middleware` | `{ name?: string, maxAge?: number, actionsBlacklist?: string }`. Redux DevTools integration; returns inert middleware if the extension is unavailable. |
| `unstableExomeDevtools(config): Middleware` | `{ name: string, maxAge?: number, ignoreListActions?: string[], ignoreListStores?: string[] }`. Experimental Exome Developer Tools integration. `name` is required. |

```ts
import { addMiddleware } from 'exome';
import { unstableExomeDevtools } from 'exome/devtools';

const stop = addMiddleware(unstableExomeDevtools({ name: 'App' }));
// Call stop() when this development session is disposed.
```

## exome/ghost

`class GhostExome` supplies an `exomeId` but does not wrap actions, notify subscribers, or run middleware. It does not extend `Exome`. Use it for inert test fixtures, not to verify real store behavior.

```ts
import { GhostExome } from 'exome/ghost';

class CounterFixture extends GhostExome {
  count = 3;
}
const fixture = new CounterFixture();
console.log(fixture.count); // 3
```

The ID member is private in the published TypeScript declaration. Read fixture data directly; use real stores when you need public ID helpers.

## exome/radi

Added in Exome 2.9.0. `useStore` creates a subscribable value for Radi children and attributes. Install Radi separately; the adapter adds no runtime dependency and is verified with Radi 0.7.1.

| Export | Contract |
| --- | --- |
| `useStore<T extends Exome, R = T>(store: T, selector?: (state: T) => R): { subscribe(callback: (value: R) => void): () => void }` | Each subscriber receives the selected value immediately, then after store notifications. Without a selector, it receives the store itself. |

```tsx
import { createRoot } from 'radi';
import { useStore } from 'exome/radi';
import { counter } from './counter.js';

function App() {
  const count = useStore(counter, store => store.count);
  const title = useStore(counter, store => `Count: ${store.count}`);
  return <button onclick={counter.increment} title={title}>{count}</button>;
}

createRoot(document.getElementById('app')!).render(<App />);
```

Configure TypeScript JSX with `"jsx": "react-jsx"`, `"jsxImportSource": "radi"`, and `"types": ["node_modules/radi/jsx.d.ts"]`. Keep the store instance stable. Pass the subscribable directly to Radi; it is not a snapshot to destructure or an accessor to call.

Radi releases each subscription when its consuming element is removed. Subscribe separately to nested Exome stores whose actions you want to observe. Async actions notify on settlement; use `update(store)` for intermediate state, as with core subscriptions. The adapter does not filter equal selected values.

### Manual Radi subscriptions

Outside a rendered element, call the returned cleanup yourself:

```ts
import { useStore } from 'exome/radi';
import { counter } from './counter.js';

const count = useStore(counter, store => store.count);
const values: number[] = [];
const stop = count.subscribe(value => values.push(value)); // current count
counter.increment(); // another value
stop();
counter.increment(); // no further values collected
```

## exome/react

`useStore<T extends Exome | null | undefined>(store: T): Readonly<T>` subscribes the component and returns the same instance. It releases its subscription on unmount or when the store argument changes. Nullish input is returned unchanged. Install React separately.

```tsx
import { useStore } from 'exome/react';
import { counter } from './counter.js';

export function CounterView() {
  const { count, increment } = useStore(counter);
  return <button onClick={increment}>{count}</button>;
}
```

Keep instances stable across renders. Subscribe each row to its own nested store; a parent subscription does not include child updates.

## exome/preact

`useStore<T extends Exome | null | undefined>(store: T): Readonly<T>` has the same contract as the React adapter, using Preact hooks. Install Preact separately.

```tsx
import { useStore } from 'exome/preact';
import { counter } from './counter.js';

export function CounterView() {
  const { count, increment } = useStore(counter);
  return <button onClick={increment}>{count}</button>;
}
```

## exome/vue

`useStore<T extends Exome>(store: T): Readonly<T>` is the published signature. At runtime it returns a proxy: data fields and getters become Vue refs, methods stay callable, and nested Exome instances are returned directly. The declaration does not accurately describe those refs. Call in Vue setup; install Vue separately.

```html
<script setup lang="ts">
import { useStore } from 'exome/vue';
import { counter } from './counter.js';
const { count, increment } = useStore(counter);
</script>

<template>
  <button @click="increment()">{{ count }}</button>
</template>
```

Templates unwrap refs. Subscribe separately to nested stores. In 2.9.0 the adapter does not register its Exome cleanup with Vue; use `subscribe` plus `onScopeDispose` for short-lived views requiring reliable teardown.

## exome/lit

`new StoreController<T extends Exome>(host: ReactiveControllerHost, store: T)` registers a controller with the host. Read `controller.store: T`. `hostConnected(): void` subscribes and requests host updates; `hostDisconnected(): void` unsubscribes. Lit calls these lifecycle methods. Install Lit separately.

```ts
import { LitElement, html } from 'lit';
import { StoreController } from 'exome/lit';
import { counter } from './counter.js';

class CounterView extends LitElement {
  controller = new StoreController(this, counter);
  render() {
    const { count, increment } = this.controller.store;
    return html`<button @click=${increment}>${count}</button>`;
  }
}
customElements.define('counter-view', CounterView);
```

Add `<counter-view></counter-view>` to the page. Keep the controller's store stable; assigning another store does not automatically rewire its subscription.

## exome/svelte

`useStore<T extends Exome, R = T>(store: T, selector?: (state: T) => R)` returns `{ subscribe(callback: (value: R) => void): () => void }`. It emits immediately, then on store updates. The returned cleanup releases the Exome subscription. Without a selector it emits the store itself.

```html
<script lang="ts">
import { useStore } from 'exome/svelte';
import { counter } from './counter.js';
const count = useStore(counter, store => store.count);
</script>

<button on:click={counter.increment}>{$count}</button>
```

This uses Svelte's store syntax (Svelte 3/4 and Svelte 5 legacy mode). Component auto-subscriptions clean up on destruction.

## exome/solid

`useStore<T extends Exome, R = T>(store: T, selector?: (state: T) => R): Accessor<R>` creates a Solid signal initialized from the store. Read the returned accessor in a reactive expression. Install Solid separately and call inside a reactive owner.

```tsx
import { useStore } from 'exome/solid';
import { counter } from './counter.js';

export function CounterView() {
  const count = useStore(counter, store => store.count);
  return <button onClick={counter.increment}>{count()}</button>;
}
```

Select a primitive or changed reference: the default selector returns the same mutable instance, so signal equality can suppress updates. In 2.9.0 its cleanup callback returns the unsubscribe function instead of calling it. For short-lived owners, use core `subscribe` with `onCleanup(stop)`.

## exome/angular

`useStore<T extends Exome, R = T>(store: T, selector?: (state: T) => R): Signal<R>` returns a read-only Angular signal. Call in an injection context (for example, a component field initializer). Install Angular separately.

```ts
import { Component } from '@angular/core';
import { useStore } from 'exome/angular';
import { counter } from './counter.js';

@Component({
  selector: 'counter-view',
  standalone: true,
  template: '<button (click)="increment()">{{ count() }}</button>',
})
export class CounterView {
  count = useStore(counter, store => store.count);
  increment = counter.increment;
}
```

Select a primitive or changed reference so signal equality detects updates. In 2.9.0 the adapter does not register destruction cleanup correctly. For short-lived components, subscribe explicitly and register the returned cleanup with `DestroyRef.onDestroy`.

## exome/rxjs

`observableFromExome<T extends Exome = Exome>(store: T): Observable<T>` emits the instance immediately on subscription and after updates. Values are the same mutable instance, not snapshots. Install RxJS separately; map to a field before using `distinctUntilChanged`.

In 2.9.0 the built-in Observable does not return the Exome teardown. For subscriptions that must be released, use this equivalent with explicit cleanup:

```ts
import { Observable, map, distinctUntilChanged } from 'rxjs';
import { subscribe } from 'exome';
import { counter } from './counter.js';

const state$ = new Observable<typeof counter>(subscriber => {
  subscriber.next(counter);
  return subscribe(counter, store => subscriber.next(store));
});
const subscription = state$
  .pipe(map(store => store.count), distinctUntilChanged())
  .subscribe(count => console.log(count));
counter.increment();
subscription.unsubscribe();
```

`exome/package.json` is also exported for package metadata; it is not a JavaScript API module. JSON import syntax depends on your runtime and bundler.

## Troubleshooting

- **No render after a mutation:** use a prototype method, or call `update(store)` after an external mutation. Arrow fields do not become actions.
- **Child changed but parent stayed stale:** subscribe to the child as well. Updates do not bubble through the store tree.
- **Loading indicator never appears:** publish the intermediate state with `update(this)`, or create `getActionStatus` before the action starts.
- **State resets on render:** stop constructing the store on every render.
- **A snapshot will not load:** register nested classes with stable names and make their constructors callable without arguments.
- **Leaked subscriptions:** own each cleanup explicitly; check the adapter limitations above.

Source of truth: [Exome source](https://github.com/Marcisbee/exome/tree/main/src), [package releases](https://www.npmjs.com/package/exome), and your installed package's types.
