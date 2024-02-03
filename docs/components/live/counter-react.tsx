import { Exome } from "exome";
import { useStore } from "exome/react";

export class CounterStore extends Exome {
	public count = 0;

	public increment() {
		this.count += 1;
	}

	public decrement() {
		this.count -= 1;
	}
}

const counterStore = new CounterStore();

export function LiveCounterReact() {
	const { count, increment, decrement } = useStore(counterStore);

	return (
		<div className="live-counter">
			<h1>{count}</h1>
			<button type="button" onClick={decrement}>
				-
			</button>
			<button type="button" onClick={increment}>
				+
			</button>
		</div>
	);
}
