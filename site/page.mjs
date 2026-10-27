import { createElement as h } from 'radi/server';
import { githubLink, navigation, sidebarBrand } from './ui.mjs';
import { content } from './content.mjs';

export async function page(markdown) {
  const { introduction, sections } = await content(markdown);
  return [
    h('a', { class: 'skip', href: '#content' }, 'Skip to content'),
    h(
      'div',
      { class: 'mobile-menu' },
      sidebarBrand(),
    ),
    h('button', {
      class: 'menu-toggle',
      type: 'button',
      hidden: true,
      'aria-label': 'Open navigation',
      'aria-controls': 'mobile-navigation',
      'aria-haspopup': 'dialog',
    }, h('span', { class: 'burger-icon', 'aria-hidden': 'true' }, h('span'))),
    h(
      'dialog',
      { id: 'mobile-navigation', 'aria-label': 'Documentation menu' },
      h(
        'div',
        { class: 'sheet-heading' },
        h('strong', null, 'On this page'),
        h('button', {
          type: 'button',
          'data-close-menu': '',
          'aria-label': 'Close navigation',
        }, h('span', { class: 'close-icon', 'aria-hidden': 'true' })),
      ),
      navigation('Mobile documentation'),
      githubLink(),
    ),
    h(
      'div',
      { class: 'layout' },
      h(
        'aside',
        { class: 'sidebar' },
        sidebarBrand(),
        navigation('Documentation'),
        githubLink(),
      ),
      h(
        'main',
        { id: 'content' },
        introduction,
        ...sections,
        h(
          'footer',
          null,
          h('span', null, 'Exome · MIT licensed'),
          h('a', { href: '#' }, 'Back to top ↑'),
        ),
      ),
    ),
  ];
}
