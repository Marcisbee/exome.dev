import { useStore } from "exome/react"
import { createRoot } from "react-dom/client";

import { CounterStore } from "./counter.store.ts"

const counterStore = new CounterStore()

function App() {
  // `useStore` will update component on action calls
  const { count, increment, decrement } = useStore(counterStore);

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={decrement}>-</button>
      <button onClick={increment}>+</button>
    </div>
  );
}

createRoot(document.body).render(<App />);
