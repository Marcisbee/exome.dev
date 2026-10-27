import { createElement as h } from 'radi/server';
import { codeToTokens } from 'shiki';

export async function code(
  label,
  source,
  lang = 'tsx',
) {
  const { tokens } = await codeToTokens(source, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
  });
  const lines = tokens.map((line) =>
    line.map((token) =>
      h('span', {
        style: `--code-light:${token.htmlStyle?.color};--code-dark:${
          token.htmlStyle?.['--shiki-dark']
        }`,
      }, token.content)
    )
  );
  return h(
    'figure',
    { class: 'code' },
    h(
      'figcaption',
      null,
      h('span', null, label),
      h('button', {
        class: 'copy',
        type: 'button',
        'data-copy': '',
        hidden: true,
        'aria-label': `Copy ${label}`,
        'aria-live': 'polite',
      }, 'Copy'),
    ),
    h(
      'pre',
      { tabindex: '0', 'aria-label': label },
      h(
        'code',
        { 'data-language': lang },
        lines.flatMap((line, index) => index ? ['\n', ...line] : line),
      ),
    ),
  );
}

export function section(
  id,
  title,
  ...content
) {
  return h(
    'section',
    { id },
    h(
      'h2',
      null,
      h(
        'a',
        { href: `#${id}`, class: 'heading-link' },
        title,
        h('span', { 'aria-hidden': 'true', class: 'anchor-mark' }, '#'),
      ),
    ),
    ...content,
  );
}

const groups = [
  ['Getting started', [['overview', 'Introduction'], ['install', 'Installation']]],
  ['Essentials', [['stores-and-actions', 'Stores and actions'], ['async-actions', 'Async actions'], ['nested-stores', 'Nested stores']]],
  ['Building apps', [['subscribe-and-integrate', 'Subscriptions'], ['react-and-preact', 'React and Preact'], ['other-adapters', 'Other adapters'], ['action-effects-and-middleware', 'Effects and middleware'], ['save-and-load', 'Save and load']]],
  ['Reference', [
    ['api-notes', 'API notes'], ['exome', 'exome'],
    ...['state', 'utils', 'devtools', 'ghost', 'radi', 'react', 'preact', 'vue', 'lit', 'svelte', 'solid', 'angular', 'rxjs']
      .map(name => [`exome-${name}`, `exome/${name}`]),
  ]],
  ['Help', [['debug-and-test', 'Debug and test'], ['troubleshooting', 'Troubleshooting']]],
];

export function navigation(label ) {
  return h(
    'nav',
    { 'aria-label': label },
    groups.map(([name, entries]) =>
      h(
        'div',
        { class: 'nav-group' },
        h('p', null, name),
        entries.map(([id, title]) =>
          h('a', {
            href: `#${id}`,
            'data-section-link': '',
            ...(id === 'overview' ? { 'aria-current': 'location' } : {}),
          }, title)
        ),
      )
    ),
  );
}

export function sidebarBrand() {
  return h(
    'div',
    { class: 'sidebar-brand' },
    h(
      'a',
      { class: 'brand', href: '/', 'aria-label': 'Exome home' },
      h('img', { src: '/icon.svg', width: 32, height: 32, alt: '' }),
      'Exome',
    ),
  );
}

export function githubLink() {
  return h(
    'a',
    { class: 'github', href: 'https://github.com/Marcisbee/exome' },
    'GitHub ↗',
  );
}
