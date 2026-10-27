import { createElement as h } from 'radi/server';
import { lexer } from 'marked';
import { codeToTokens } from 'shiki';

export const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function render(tokens) {
  return Promise.all(tokens.map(async token => {
    const children = () => render(token.tokens ?? []);
    switch (token.type) {
      case 'space': return null;
      case 'text': return token.tokens ? children() : token.text;
      case 'escape': return token.text;
      case 'paragraph': return h('p', null, await children());
      case 'strong': return h('strong', null, await children());
      case 'em': return h('em', null, await children());
      case 'codespan': return h('code', null, token.text);
      case 'link': return h('a', { href: token.href }, await children());
      case 'heading': return h(`h${token.depth}`, { id: slug(token.text) },
        h('a', { href: `#${slug(token.text)}`, class: 'heading-link' }, await children()));
      case 'list': return h(token.ordered ? 'ol' : 'ul', token.ordered ? { start: token.start } : null,
        await Promise.all(token.items.map(async item => h('li', null, await render(item.tokens)))));
      case 'table': {
        const header = await Promise.all(token.header.map(async cell =>
          h('th', { scope: 'col' }, await render(cell.tokens))));
        const rows = await Promise.all(token.rows.map(async row =>
          h('tr', null, await Promise.all(row.map(async cell =>
            h('td', null, await render(cell.tokens)))))));
        return h('div', { class: 'table-scroll', tabindex: '0', 'aria-label': 'Reference table' },
          h('table', null, h('thead', null, h('tr', null, header)), h('tbody', null, rows)));
      }
      case 'code': {
        const { tokens: lines } = await codeToTokens(token.text, {
          lang: token.lang || 'text', themes: { light: 'github-light', dark: 'github-dark' },
        });
        return h('figure', { class: 'code' },
          h('figcaption', null, h('span', null, token.lang || 'text'),
            h('button', { type: 'button', class: 'copy', hidden: true, 'aria-label': 'Copy code', 'aria-live': 'polite' }, 'Copy')),
          h('pre', { tabindex: '0' }, h('code', null, lines.flatMap((line, index) => [
            ...(index ? ['\n'] : []),
            ...line.map(part => h('span', { style: `--code-light:${part.htmlStyle.color};--code-dark:${part.htmlStyle['--shiki-dark']}` }, part.content)),
          ]))));
      }
      default: throw new Error(`Unsupported guide syntax: ${token.type}`);
    }
  }));
}

export async function page(markdown) {
  const tokens = lexer(markdown);
  const headings = tokens.filter(token => token.type === 'heading' && token.depth === 2);
  const navigation = label => h('nav', { 'aria-label': label },
    h('div', { class: 'nav-group' }, h('p', null, 'Documentation'),
      headings.map(heading => h('a', { href: `#${slug(heading.text)}`, 'data-section-link': '' }, heading.text))),
    h('div', { class: 'nav-group' }, h('p', null, 'For agents'),
      h('a', { href: '/index.md' }, 'Complete Markdown ↗'), h('a', { href: '/llms.txt' }, 'llms.txt ↗')));
  const brand = () => h('div', { class: 'sidebar-brand' },
    h('a', { class: 'brand', href: '/', 'aria-label': 'Exome home' },
      h('img', { src: '/icon.svg', width: 32, height: 32, alt: '' }), 'Exome'),
    h('span', { class: 'version' }, 'v2.8.1'));
  return h('div', null,
    h('a', { href: '#content', class: 'skip' }, 'Skip to content'),
    h('header', { class: 'mobile-menu' }, brand(),
      h('details', null, h('summary', null, 'Contents'), navigation('Mobile documentation'))),
    h('div', { class: 'layout' },
      h('aside', { class: 'sidebar' }, brand(), navigation('Documentation'),
        h('a', { class: 'github', href: 'https://github.com/Marcisbee/exome' }, 'GitHub ↗')),
      h('main', { id: 'content', tabindex: '-1' },
        h('p', { class: 'eyebrow' }, 'REFERENCE / EXOME'),
        await render(tokens),
        h('footer', null, h('span', null, 'Exome 2.8.1'),
          h('a', { href: 'https://radi.js.org/' }, 'Built with Radi')))));
}
