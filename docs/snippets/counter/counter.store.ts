import { Exome } from "exome"

// We'll have a store called "CounterStore"
export class CounterStore extends Exome {
  // Set up one property "count" with default value `0`
  public count = 0

  // Create two actions that will update "count" value
  public increment() {
    this.count += 1
  }

  public decrement() {
    this.count -= 1
  }
}
