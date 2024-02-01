import { CounterStore } from "./counter.store.ts"

// Initialize new counter store
const counterStore = new CounterStore()

// It contains default values
counterStore.count // => 0

// We can call actions and use this instance as usual
counterStore.increment()

counterStore.count // => 1
