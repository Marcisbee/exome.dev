import { Exome } from "exome";
import { useStore } from "exome/react";
import { useEffect } from "react";

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

export function LiveCounterReactInterval() {
	const { count, increment, decrement } = useStore(counterStore);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const interval = setInterval(counterStore.increment, 1000);

		return () => {
			clearInterval(interval);
		};
	}, []);

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
