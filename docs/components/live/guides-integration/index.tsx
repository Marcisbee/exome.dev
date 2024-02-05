import { Exome } from "exome";
import { useStore } from "exome/react";

export class CounterStore extends Exome {
  public count = 0;

  public increment() {
    this.count += 1;
  }
}

const counterStore = new CounterStore();

export function LiveGuidesIntegrationReact() {
  const { count, increment } = useStore(counterStore);

  return (
    <div className="counter-single-button">
      <button type="button" id="count" onClick={increment}>
        {count}
      </button>
    </div>
  );
}
