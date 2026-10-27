import { Exome } from 'exome';
import { useStore } from 'exome/radi';
import { createElement as h, createRoot } from 'radi';
import { counterDemo } from './counter-view.mjs';

class SharedCounter extends Exome {
  count = 0;
  increment() { this.count += 1; }
}

const host = document.getElementById('counter-demo');
if (host) {
  const store = new SharedCounter();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  createRoot(host).render(counterDemo(h, useStore(store, state => state.count), event => {
    store.increment();
    const burst = event.currentTarget.querySelector('.counter-burst');
    for (const animation of burst.getAnimations()) animation.cancel();
    if (!event.detail || reducedMotion.matches) return;
    burst.animate([
      { transform: 'scale(0.3)', opacity: 1 },
      { transform: 'scale(1.6)', opacity: 0 },
    ], { duration: 240, easing: 'ease-out' });
  }));
}
