const frameworks = [
  ['react', 'React', '#0074a6'], ['preact', 'Preact', '#673ab8'],
  ['vue', 'Vue', '#24845b'], ['svelte', 'Svelte', '#e93600'],
  ['lit', 'Lit', '#324fff'], ['angular', 'Angular', '#e90464'],
  ['rxjs', 'RxJS', '#de1c85'], ['radi', 'Radi', '#7046d2'],
];

export function counterDemo(h, count = 0, increment) {
  return h('div', { class: 'shared-counter', role: 'group', 'aria-label': 'Shared counter demo' },
    h('div', { class: 'counter-display' },
      h('output', { 'aria-label': 'Shared count', 'aria-live': 'polite', 'aria-atomic': 'true' }, count)),
    h('div', { class: 'framework-buttons' }, frameworks.map(([id, name, color]) =>
      h('button', { type: 'button', disabled: !increment, title: name,
        'aria-label': `Increment with ${name}`, style: `--framework-color:${color}`,
        onclick: increment },
        h('span', { class: 'counter-burst', 'aria-hidden': 'true' }),
        h('img', { src: `/framework-icons/${id}.svg`, alt: '', width: id === 'radi' ? 32 : 26, height: id === 'radi' ? 32 : 26 })))),
    h('p', { class: 'counter-caption' }, 'Pick a framework. They all move the same count.'));
}
