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
  const pending = new Set();
  const settlePending = () => { for (const settle of pending) settle(false); };
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      settlePending();
      for (const animation of host.getAnimations({ subtree: true })) animation.cancel();
    }
  });
  window.addEventListener('resize', settlePending);
  document.addEventListener('visibilitychange', () => { if (document.hidden) settlePending(); });

  createRoot(host).render(counterDemo(h, useStore(store, state => state.count), event => {
    if (!event.detail || reducedMotion.matches) {
      store.increment();
      return;
    }
    const button = event.currentTarget;
    const output = host.querySelector('output');
    const origin = host.getBoundingClientRect();
    const start = button.getBoundingClientRect();
    const end = output.getBoundingClientRect();
    const x = start.x + start.width / 2 - origin.x;
    const y = start.y + start.height / 2 - origin.y;
    const dx = end.x + end.width / 2 - origin.x - x;
    const dy = end.y + end.height / 2 - origin.y - y;
    const bubble = document.createElement('span');
    bubble.className = 'counter-flight';
    bubble.setAttribute('aria-hidden', 'true');
    bubble.textContent = '+1';
    bubble.style.left = `${x - 10}px`;
    bubble.style.top = `${y - 10}px`;
    bubble.style.background = getComputedStyle(button).getPropertyValue('--framework-color');
    host.append(bubble);
    const flight = bubble.animate([
      { transform: 'translate(0, 0) scale(0.7)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.6 - 24}px) scale(1.2)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.5 },
    ], { duration: 420, easing: 'cubic-bezier(0.25, 0.1, 0.5, 1)', fill: 'forwards' });
    const settle = (pulse = true) => {
      if (!pending.delete(settle)) return;
      flight.cancel();
      bubble.remove();
      store.increment();
      if (!pulse || reducedMotion.matches) return;
      const current = getComputedStyle(output).transform;
      for (const animation of output.getAnimations()) animation.cancel();
      output.animate([
        { transform: current },
        { transform: 'scale(1.22)', offset: 0.35 },
        { transform: 'scale(1)' },
      ], { duration: 220, easing: 'ease-out' });
    };
    pending.add(settle);
    flight.finished.then(() => settle(), () => settle(false));
  }));
}
